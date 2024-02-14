import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQueryType,
  GetAllProductsBody,
  NewProductRequestBody,
} from "../types/user.js";
import { Products } from "../models/products.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
// import { faker } from "@faker-js/faker";
import { nodeCache } from "../app.js";
import { Revalidate } from "../utils/features.js";

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;

    const photo = req.file;

    if (!photo) {
      return next(new ErrorHandler("Please add the photo", 400));
    }

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Deleted Successfully");
      });

      return next(new ErrorHandler("Please Fill all Fields", 400));
    }

    await Products.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    Revalidate({ products: true, admin: true });

    return res.status(200).json({
      success: true,
      message: "Product created Successfully",
    });
  }
);

//Revalidate on New,Update,Delete and on New Order
export const LatestProducts = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let products;

    if (nodeCache.has("latest-products")) {
      products = JSON.parse(nodeCache.get("latest-products") as string);
    } else {
      products = await Products.find({}).sort({ createdAt: -1 }).limit(5);
      nodeCache.set("latest-products", JSON.stringify(products));
    }

    return res.status(200).json({
      success: true,
      products,
    });
  }
);

//Revalidate on New,Update,Delete and on New Order
export const GetAllCategories = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let categories;

    if (nodeCache.has("categories")) {
      categories = JSON.parse(nodeCache.get("categories") as string);
    } else {
      categories = await Products.distinct("category");
      nodeCache.set("categories", JSON.stringify(categories));
    }

    return res.status(200).json({
      success: true,
      categories,
    });
  }
);

//Revalidate on New,Update,Delete and on New Order
export const AdminProducts = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let products;

    if (nodeCache.has("admin-products")) {
      products = JSON.parse(nodeCache.get("admin-products") as string);
    } else {
      products = await Products.find({});
      nodeCache.set("admin-products", JSON.stringify(products));
    }

    return res.status(200).json({
      success: true,
      products,
    });
  }
);

//Revalidate on New,Update,Delete and on New Order
export const GetProductById = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let product;

    let id = req.params.id;

    if (nodeCache.has(`product-${id}`)) {
      product = JSON.parse(nodeCache.get(`product-${id}`) as string);
    } else {
      product = await Products.findById(id);
      nodeCache.set(`product-${id}`, JSON.stringify(product));
    }

    return res.status(200).json({
      success: true,
      product,
    });
  }
);

export const UpdateProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;

    const photo = req.file;

    const product = await Products.findById(id);

    if (!product) {
      return next(new ErrorHandler("Product Not Found", 400));
    }

    if (photo) {
      rm(product.photo!, () => {
        console.log("Old Photo Deleted");
      });

      product.photo = photo.path;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;

    await product.save();

    Revalidate({ products: true, admin: true, productId: String(product._id) });

    return res.status(200).json({
      success: true,
      message: "Product updated Successfully",
    });
  }
);

export const DeleteProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const product = await Products.findById(id);

    if (!product) {
      return next(new ErrorHandler("Product Not Found", 400));
    }

    rm(product.photo!, () => {
      console.log("Photo Deleted");
    });

    await product.deleteOne();

    Revalidate({ products: true, admin: true, productId: String(product._id) });

    return res.status(200).json({
      success: true,
      message: "Product deleted Successfully",
    });
  }
);

export const GetAllProducts = TryCatch(
  async (
    req: Request<{}, {}, {}, GetAllProductsBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip = (page - 1) * limit;

    const baseQuery: BaseQueryType = {};

    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      };
    }

    if (category) {
      baseQuery.category = category;
    }

    const [products, filteredOnlyProduct] = await Promise.all([
      Products.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip),
      Products.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// export const fakerProducts=async(count:number)=>{
//   const products=[]

//   for(let i=0;i<count;i++)
//   {
//     const product={
//       name:faker.commerce.productName(),
//       photo:"uploads\\e2f099f7-60e9-4ccd-8fa5-9c28226147cd.jpg",
//       price:faker.commerce.price({min:1500,max:80000,dec:0}),
//       stock:faker.commerce.price({min:0,max:10,dec:0}),
//       category:faker.commerce.department(),
//       createdAt:new Date(faker.date.past()),
//       updateAt:new Date(faker.date.recent()),
//       _v:0
//     }

//     products.push(product)
//   }

//   await Products.create(products)

//   console.log({success:true})
// }

// export const deleteProducts=async(count:number)=>{
//   const products=await Products.find({}).skip(2)

//   for(let i=0;i<products.length;i++)
//   {
//     const product=products[i]
//     await product.deleteOne()
//   }

//   console.log({success:true})
// }
