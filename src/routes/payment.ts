import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  createPayment,
  deleteCoupon,
  getAllCoupons,
  getCouponDiscount,
  newCoupon,
} from "../controllers/payment.js";

const router = express.Router();

// route - /api/v1/payment/create
router.post("/create", createPayment);

// route - /api/v1/payment/coupon/new
router.post("/coupon/new", adminOnly, newCoupon);

// route - /api/v1/payment/coupon/discount
router.get("/coupon/discount", getCouponDiscount);

// route - /api/v1/payment/coupon/all
router.get("/coupon/all", adminOnly, getAllCoupons);

// route - /api/v1/payment/coupon/delete/:id
router.delete("/coupon/delete/:id", adminOnly, deleteCoupon);

export default router;
