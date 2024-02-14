import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { NewUserRequestBody } from "./../types/user.js";
import { NextFunction, Request, Response } from "express";

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    let user=await User.findById(_id)

    if(user)
    {
      return res.status(200).json({
        success: true,
        message: `Welcome, ${user.name}`,
      });
    }

    if(!name || !email || !photo || !gender || !_id || !dob)
    {
      return next(new ErrorHandler("Please Fill all the Fields",400))
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob: new Date(dob),
    });

    return res.status(200).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);


export const getAllUser=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
  const users=await User.find({})

  return res.status(200).json({
    success:true,
    users
  })
})

export const getUserById=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{

  const id=req.params.id

  const user=await User.findById(id)

  if(!user)
  {
    return next(new ErrorHandler("Invalid Id",400))
  }

  return res.status(200).json({
    success:true,
    user
  })
})

export const deleteUser=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{

  const id=req.params.id

  const user=await User.findById(id)

  if(!user)
  {
    return next(new ErrorHandler("Invalid Id",400))
  }

  await user.deleteOne()

  return res.status(200).json({
    success:true,
    message:"User Deleted Successfully"
  })
})