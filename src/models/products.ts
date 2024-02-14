import mongoose from "mongoose";

const schema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter your Name"]
    },
    photo:{
        type:String,
        required:[true,"Please enter photo"]
    },
    price:{
        type:Number,
        required:[true,"Please enter price"]
    },
    stock:{
        type:Number,
        required:[true,"Please enter stock"]
    },
    category:{
        type:String,
        required:[true,"Please enter product category"],
        trim:true
    },
},{
    timestamps:true
})

export const Products=mongoose.model("Products",schema)