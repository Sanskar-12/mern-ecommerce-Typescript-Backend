import express from "express"
import { AdminProducts, DeleteProduct, GetAllCategories, GetAllProducts, GetProductById, LatestProducts, UpdateProduct, newProduct } from "../controllers/product.js"
import { singleUpload } from "../middlewares/multer.js"
import { adminOnly } from "../middlewares/auth.js"

const router=express.Router()

// /api/v1/product/new
router.post("/new",adminOnly,singleUpload,newProduct)

// /api/v1/product/latest
router.get("/latest",LatestProducts)

// /api/v1/product/latest
router.get("/all",GetAllProducts)


// /api/v1/product/category
router.get("/category",GetAllCategories)

// /api/v1/product/admin-products
router.get("/admin-products",adminOnly,AdminProducts)


// /api/v1/product/:id
router.get("/:id",GetProductById)

// /api/v1/product/:id
router.put("/:id",adminOnly,singleUpload,UpdateProduct)

// /api/v1/product/:id
router.delete("/:id",adminOnly,DeleteProduct)
export default router