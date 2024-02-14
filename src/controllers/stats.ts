import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { nodeCache } from "../app.js";
import { Products } from "../models/products.js";
import { User } from "../models/user.js";
import { Order } from "../models/order.js";
import {
  calculatePercentage,
  getChartData,
  getInventoryCategories,
} from "../utils/features.js";

export const getDashboardStats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let stats = {};

    if (nodeCache.has("admin-stats")) {
      stats = JSON.parse(nodeCache.get("admin-stats") as string);
    } else {
      const today = new Date();
      const sixMonthsAgo = new Date();

      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const thisMonth = {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };

      const prevMonth = {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      };

      const thisMonthProductsPromise = Products.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      });

      const prevMonthProductsPromise = Products.find({
        createdAt: {
          $gte: prevMonth.start,
          $lte: prevMonth.end,
        },
      });

      const thisMonthUsersPromise = User.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      });

      const prevMonthUsersPromise = User.find({
        createdAt: {
          $gte: prevMonth.start,
          $lte: prevMonth.end,
        },
      });

      const thisMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      });

      const prevMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: prevMonth.start,
          $lte: prevMonth.end,
        },
      });

      const sixMonthsAgoOrdersPromise = Order.find({
        createdAt: {
          $gte: sixMonthsAgo,
          $lte: today,
        },
      });

      const latestTransactionsPromise = Order.find({})
        .select(["orderItems", "discount", "total", "status"])
        .limit(4);

      const [
        thisMonthProducts,
        thisMonthUsers,
        thisMonthOrders,
        prevMonthProducts,
        prevMonthUsers,
        prevMonthOrders,
        productcount,
        usercount,
        orderscount,
        sixMonthsAgoOrders,
        categories,
        maleUsersCount,
        latestTransaction,
      ] = await Promise.all([
        thisMonthProductsPromise,
        thisMonthUsersPromise,
        thisMonthOrdersPromise,
        prevMonthProductsPromise,
        prevMonthUsersPromise,
        prevMonthOrdersPromise,
        Products.countDocuments(),
        User.countDocuments(),
        Order.find({}).select("total"),
        sixMonthsAgoOrdersPromise,
        Products.distinct("category"),
        User.countDocuments({ gender: "male" }),
        latestTransactionsPromise,
      ]);

      let thisMonthtotal = 0;
      let prevMonthtotal = 0;

      thisMonthOrders.forEach(
        (i) => (thisMonthtotal = thisMonthtotal + i.total)
      );

      prevMonthOrders.forEach(
        (i) => (prevMonthtotal = prevMonthtotal + i.total)
      );

      const changePercent = {
        revenue: calculatePercentage(thisMonthtotal, prevMonthtotal),
        products: calculatePercentage(
          thisMonthProducts.length,
          prevMonthProducts.length
        ),
        users: calculatePercentage(
          thisMonthUsers.length,
          prevMonthUsers.length
        ),
        orders: calculatePercentage(
          thisMonthOrders.length,
          prevMonthOrders.length
        ),
      };

      let totalrevenue = 0;

      orderscount.forEach((i) => (totalrevenue = totalrevenue + i.total));

      let orderCountInaMonth = new Array(6).fill(0);
      let ordersRevenueCountInaMonth = new Array(6).fill(0);

      sixMonthsAgoOrders.forEach((order) => {
        const creationDate = order.createdAt;
        const monthDiff =
          (today.getMonth() - creationDate.getMonth() + 12) % 12;

        if (monthDiff < 6) {
          orderCountInaMonth[6 - monthDiff - 1] += 1;
          ordersRevenueCountInaMonth[6 - monthDiff - 1] += order.total;
        }
      });

      const count = {
        totalRevenue: totalrevenue,
        productCount: productcount,
        userCount: usercount,
        ordersCount: orderscount.length,
      };

      let categoryCount = await getInventoryCategories({
        categories,
        productcount,
      });

      const genderRatio = {
        male: maleUsersCount,
        female: usercount - maleUsersCount,
      };

      const modifiedLastetOrderTransaction = latestTransaction.map((i) => ({
        _id: i._id,
        discount: i.discount,
        amount: i.total,
        quantity: i.orderItems.length,
        status: i.status,
      }));

      stats = {
        categoryCount,
        changePercent,
        count,
        latestTransaction: modifiedLastetOrderTransaction,
        chart: {
          order: orderCountInaMonth,
          revenue: ordersRevenueCountInaMonth,
        },
        genderRatio,
      };

      nodeCache.set("admin-stats", JSON.stringify(stats));
    }

    return res.status(200).json({
      success: true,
      stats,
    });
  }
);

export const getPieStats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let charts;
    if (nodeCache.has("pie-chart-stats")) {
      charts = JSON.parse(nodeCache.get("pie-chart-stats") as string);
    } else {
      const [
        ProcessingPromise,
        ShippedPromise,
        DeliveredPromise,
        categories,
        productcount,
        productsOutOfStock,
        allOrders,
        ageGroupUsers,
        adminUsers,
        customerUsers,
      ] = await Promise.all([
        Order.countDocuments({ status: "Processing" }),
        Order.countDocuments({ status: "Shipped" }),
        Order.countDocuments({ status: "Delivered" }),
        Products.distinct("category"),
        Products.countDocuments(),
        Products.countDocuments({ stock: 0 }),
        Order.find({}).select([
          "total",
          "discount",
          "subtotal",
          "tax",
          "shippingCharges",
        ]),
        User.find({}).select(["dob"]),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "user" }),
      ]);

      let categoryCount = await getInventoryCategories({
        categories,
        productcount,
      });

      const orderFulfillment = {
        processing: ProcessingPromise,
        shipped: ShippedPromise,
        delivered: DeliveredPromise,
      };

      const stockAvailability = {
        inStock: productcount - productsOutOfStock,
        outOfStock: productsOutOfStock,
      };

      const grossIncome = allOrders.reduce(
        (prev, order) => prev + (order.total || 0),
        0
      );

      const discount = allOrders.reduce(
        (prev, order) => prev + (order.discount || 0),
        0
      );

      const productionCost = allOrders.reduce(
        (prev, order) => prev + (order.shippingCharges || 0),
        0
      );

      const burnt = allOrders.reduce(
        (prev, order) => prev + (order.tax || 0),
        0
      );

      const marketingCost = Math.round(grossIncome * (30 / 100));

      const netMargin =
        grossIncome - discount - productionCost - burnt - marketingCost;

      const revenueDistribution = {
        netMargin,
        discount,
        productionCost,
        burnt,
        marketingCost,
      };

      const adminCustomers = {
        adminUsers,
        customerUsers,
      };

      const usersAgeGroup = {
        teen: ageGroupUsers.filter((i) => i.age < 20).length,
        adult: ageGroupUsers.filter((i) => i.age >= 20 && i.age < 40).length,
        old: ageGroupUsers.filter((i) => i.age >= 40).length,
      };

      charts = {
        orderFulfillment,
        productCategories: categoryCount,
        stockAvailability,
        revenueDistribution,
        adminCustomers,
        usersAgeGroup,
      };

      nodeCache.set("pie-chart-stats", JSON.stringify(charts));
    }

    return res.status(200).json({
      success: true,
      charts,
    });
  }
);

export const getBarStats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let charts;

    if (nodeCache.has("bar-chart-stats")) {
      charts = JSON.parse(nodeCache.get("bar-chart-stats") as string);
    } else {
      const today = new Date();

      const sixMonthAgo = new Date();
      sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

      const twelveMonthAgo = new Date();
      twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

      const sixMonthProductPromise = Products.find({
        createdAt: {
          $gte: sixMonthAgo,
          $lte: today,
        },
      }).select("createdAt");

      const sixMonthUsersPromise = User.find({
        createdAt: {
          $gte: sixMonthAgo,
          $lte: today,
        },
      }).select("createdAt");

      const twelveMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: twelveMonthAgo,
          $lte: today,
        },
      }).select("createdAt");

      const [sixMonthProduct, sixMonthUsers, twelveMonthOrders] =
        await Promise.all([
          sixMonthProductPromise,
          sixMonthUsersPromise,
          twelveMonthOrdersPromise,
        ]);

      const productsCount = getChartData({
        length: 6,
        docArr: sixMonthProduct,
        today,
      });
      const usersCount = getChartData({
        length: 6,
        docArr: sixMonthUsers,
        today,
      });
      const ordersCount = getChartData({
        length: 12,
        docArr: twelveMonthOrders,
        today,
      });

      charts = {
        products: productsCount,
        users: usersCount,
        orders: ordersCount,
      };

      nodeCache.set("bar-chart-stats", JSON.stringify(charts));
    }

    return res.status(200).json({
      success: true,
      charts,
    });
  }
);

export const getLineStats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let charts;

    if (nodeCache.has("line-chart-stats")) {
      charts = JSON.parse(nodeCache.get("line-chart-stats") as string);
    } else {
      const today = new Date();

      const twelveMonthAgo = new Date();
      twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

      const baseQuery = {
        createdAt: {
          $gte: twelveMonthAgo,
          $lte: today,
        },
      };

      const twelveMonthProductPromise =
        Products.find(baseQuery).select("createdAt");

      const twelveMonthUsersPromise = User.find(baseQuery).select("createdAt");

      const twelveMonthOrdersPromise = Order.find(baseQuery).select([
        "createdAt",
        "discount",
        "total",
      ]);

      const [twelveMonthProduct, twelveMonthUsers, twelveMonthOrders] =
        await Promise.all([
          twelveMonthProductPromise,
          twelveMonthUsersPromise,
          twelveMonthOrdersPromise,
        ]);

      const productsCount = getChartData({
        length: 12,
        docArr: twelveMonthProduct,
        today,
      });
      const usersCount = getChartData({
        length: 12,
        docArr: twelveMonthUsers,
        today,
      });
      const discountCount = getChartData({
        length: 12,
        docArr: twelveMonthOrders,
        today,
        property: "discount",
      });
      const totalCount = getChartData({
        length: 12,
        docArr: twelveMonthOrders,
        today,
        property: "total",
      });

      charts = {
        products: productsCount,
        users: usersCount,
        discount: discountCount,
        revenue: totalCount,
      };

      nodeCache.set("line-chart-stats", JSON.stringify(charts));
    }

    return res.status(200).json({
      success: true,
      charts,
    });
  }
);
