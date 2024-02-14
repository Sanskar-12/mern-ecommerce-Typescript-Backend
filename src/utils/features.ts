import mongoose, { Document } from "mongoose";
import { OrderItemType, RevalidateCache } from "../types/user.js";
import { Products } from "../models/products.js";
import { nodeCache } from "../app.js";

export const connectDB = async (uri: string) => {
  try {
    const { connection } = await mongoose.connect(uri);

    console.log(connection.host);
  } catch (error) {
    console.log(error);
  }
};

export const Revalidate = ({
  products,
  order,
  admin,
  userId,
  orderId,
  productId,
}: RevalidateCache) => {
  if (products) {
    let productKeys: string[] = [
      "latest-products",
      "categories",
      "admin-products",
    ];

    if (typeof productId === "string") {
      productKeys.push(`product-${productId}`);
    }

    if (typeof productId === "object") {
      productId.forEach((i) => productKeys.push(`product-${i}`));
    }

    nodeCache.del(productKeys);
  }
  if (order) {
    let orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    nodeCache.del(orderKeys);
  }
  if (admin) {
    nodeCache.del([
      "admin-stats",
      "pie-chart-stats",
      "bar-chart-stats",
      "line-chart-stats",
    ]);
  }
};

export const ReduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    let order = orderItems[i];
    const products = await Products.findById(order.productId);

    if (!products) throw new Error("Product Not Found");
    products.stock = products.stock - order.quantity;

    await products.save();
  }
};

export const calculatePercentage = (thisMonth: number, prevMonth: number) => {
  if (prevMonth === 0) {
    return thisMonth * 100;
  }

  const percent = (thisMonth / prevMonth) * 100;
  return Number(percent.toFixed(0));
};

type CategoryType = {
  categories: string[];
  productcount: number;
};

export const getInventoryCategories = async ({
  categories,
  productcount,
}: CategoryType) => {
  const categoryCountPromise = categories.map((category) =>
    Products.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoryCountPromise);

  let categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productcount) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: string;
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  let data: number[] = new Array(length).fill(0);

  docArr.forEach((order) => {
    const creationDate = order.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < 6) {
      if (property === "discount") {
        data[length - monthDiff - 1] += order.discount!;
      } else if (property === "total") {
        data[length - monthDiff - 1] += order.total!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};
