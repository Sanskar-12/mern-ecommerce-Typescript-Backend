import express from "express"
import { adminOnly } from "../middlewares/auth.js"
import { getBarStats, getDashboardStats, getLineStats, getPieStats } from "../controllers/stats.js"

const router=express.Router()


// route - /api/v1/admin/stats
router.get("/stats",adminOnly,getDashboardStats)

// route - /api/v1/admin/pie
router.get("/pie",adminOnly,getPieStats)

// route - /api/v1/admin/bar
router.get("/bar",adminOnly,getBarStats)

// route - /api/v1/admin/line
router.get("/line",adminOnly,getLineStats)

export default router