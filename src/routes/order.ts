import express from "express"
import { allOrders, deleteOrders, getOrderDetails, myOrders, newOrder, processOrders } from "../controllers/order.js"
import { adminOnly } from "../middlewares/auth.js"

const router=express.Router()


// route - /api/v1/order/new
router.post("/new",newOrder)


// route - /api/v1/order/my
router.get("/my",myOrders)


// route - /api/v1/order/all
router.get("/all-orders",adminOnly,allOrders)

// route - /api/v1/order/:id
router.get("/:id",getOrderDetails)

// route - /api/v1/order/:id
router.put("/:id",adminOnly,processOrders)

// route - /api/v1/order/:id
router.delete("/:id",adminOnly,deleteOrders)

export default router