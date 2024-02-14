import express from "express";
import UserRouter from "./routes/user.js";
import ProductRouter from "./routes/product.js";
import OrderRouter from "./routes/order.js";
import PaymentRouter from "./routes/payment.js";
import AdminRouter from "./routes/stats.js";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";

config({ path: "./.env" });

const port = process.env.PORT || 4000;
const mongouri = process.env.MONGO_URI || "";
const stripekey = process.env.STRIPE_KEY || "";

const app = express();
connectDB(mongouri);

export const stripe = new Stripe(stripekey);
export const nodeCache = new NodeCache();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// app.use("/api/v1",(req:Request,res:Response)=>{
//     res.send("hello")
// })

app.use("/api/v1/user", UserRouter);
app.use("/api/v1/product", ProductRouter);
app.use("/api/v1/order", OrderRouter);
app.use("/api/v1/payment", PaymentRouter);
app.use("/api/v1/admin", AdminRouter);

app.use("/uploads", express.static("uploads"));

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is Running on port ${port}`);
});
