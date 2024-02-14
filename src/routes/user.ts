import express from "express"
import { deleteUser, getAllUser, getUserById, newUser } from "../controllers/user.js"
import { adminOnly } from "../middlewares/auth.js"

const router=express.Router()


// route - /api/v1/user/new
router.post("/new",newUser)

// route - /api/v1/user/all
router.get("/all",adminOnly,getAllUser)

// route - /api/v1/user/:id
router.get("/:id",getUserById)

// route - /api/v1/user/:id
router.delete("/:id",adminOnly,deleteUser)

export default router