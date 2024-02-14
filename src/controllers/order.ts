import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/user.js";
import { Order } from "../models/order.js";
import { ReduceStock, Revalidate } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { nodeCache } from "../app.js";

export const newOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
      orderItems,
    } = req.body;

    if (!shippingInfo || !user || !subtotal || !tax || !total || !orderItems) {
      return next(new ErrorHandler("Please Fill all Fields", 400));
    }

    let order = await Order.create({
      shippingInfo,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
      orderItems,
    });

    await ReduceStock(orderItems);

    Revalidate({
      products: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    return res.status(200).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const myOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;

    let order = [];

    if (nodeCache.has(`my-orders-${id}`)) {
      order = JSON.parse(nodeCache.get(`my-orders-${id}`) as string);
    } else {
      order = await Order.find({ user: id });
      nodeCache.set(`my-orders-${id}`, JSON.stringify(order));
    }

    return res.status(200).json({
      success: true,
      order,
    });
  }
);

export const allOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let order = [];

    if (nodeCache.has(`all-orders`)) {
      order = JSON.parse(nodeCache.get(`all-orders`) as string);
    } else {
      order = await Order.find({}).populate("user", "name");
      nodeCache.set(`all-orders`, JSON.stringify(order));
    }

    return res.status(200).json({
      success: true,
      order,
    });
  }
);

export const getOrderDetails = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    let order;

    if (nodeCache.has(`order-${id}`)) {
      order = JSON.parse(nodeCache.get(`order-${id}`) as string);
    } else {
      order = await Order.findById(id).populate("user", "name");

      if (!order) {
        return next(new ErrorHandler("Order Not Found", 400));
      }
      nodeCache.set(`order-${id}`, JSON.stringify(order));
    }

    return res.status(200).json({
      success: true,
      order,
    });
  }
);

export const processOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return next(new ErrorHandler("Order Not Found", 400));
    }

    switch (order.status) {
      case "Processing":
        order.status = "Shipped";
        break;
      case "Shipped":
        order.status = "Delivered";
        break;

      default:
        order.status = "Delivered";
        break;
    }

    await order.save();

    Revalidate({
      products: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    return res.status(200).json({
      success: true,
      message: "Order Processed Successfully",
    });
  }
);

export const deleteOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return next(new ErrorHandler("Order Not Found", 400));
    }

    await order.deleteOne();

    Revalidate({
      products: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    return res.status(200).json({
      success: true,
      message: "Order Deleted Successfully",
    });
  }
);
