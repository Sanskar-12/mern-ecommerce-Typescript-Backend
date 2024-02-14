import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { Coupon } from "../models/coupon.js";
import { stripe } from "../app.js";

export const createPayment = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount, shipping } = req.body;

    if (!amount) {
      return next(new ErrorHandler("Please Enter the Amount", 400));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      description: "payment",
      currency: "inr",
      shipping,
    });

    return res.status(200).json({
      success: true,
      cleintSecret: paymentIntent.client_secret,
    });
  }
);

export const newCoupon = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { coupon, amount } = req.body;

    if (!coupon || !amount) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    await Coupon.create({ code: coupon, amount });

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon} Created Successfully`,
    });
  }
);

export const getCouponDiscount = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { coupon } = req.query;

    const discount = await Coupon.findOne({ code: coupon });

    if (!discount) {
      return next(new ErrorHandler("Invalid Coupon Code", 400));
    }

    return res.status(200).json({
      success: true,
      discount: discount.amount,
    });
  }
);

export const getAllCoupons = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const coupons = await Coupon.find({});

    return res.status(200).json({
      success: true,
      coupons,
    });
  }
);

export const deleteCoupon = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return next(new ErrorHandler("Invalid Coupon Id", 400));
    }

    await coupon.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Coupon Deleted Successfully",
    });
  }
);
