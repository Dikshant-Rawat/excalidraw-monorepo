import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "@repo/backend-common/config";

declare module "express" {
    interface Request {
    userId?: string;
  }
}

export function middleware(req : Request, res : Response, next : NextFunction){
    const authHeaders = req.headers.authorization;
    if(!authHeaders || !authHeaders.startsWith("Bearer")){
        return res.status(411).json({
            "message" : "Error in authorization tokens"
        });
    };

    const token = authHeaders.split(' ')[1] ?? "";
    try{
        //@ts-ignore
        const decoded = jwt.verify(token , JWT_SECRET) as {userId:string};
        req.userId = decoded.userId;
    }
    catch(err){
        return res.status(403).json({ "message": "error while decoding token" });
    }

    console.log("authentication successfull");
    next();
}