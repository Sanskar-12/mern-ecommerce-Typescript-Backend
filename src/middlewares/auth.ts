import { NextFunction, Request, Response } from "express";
import { TryCatch } from "./error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";

export const adminOnly=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
    const {id}=req.query

    const user=await User.findById(id)

    if(!user)
    {
        return next(new ErrorHandler("Invalid Id",400))
    }
    if(user.role!=="admin")
    {
        return next(new ErrorHandler("Not Authorised",400))
    }

    next()
})