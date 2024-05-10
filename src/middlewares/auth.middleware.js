import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

// Below in async(req, res, next) we are not using res so we are replacing it by '_'(underscore)
export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // get token from cookie or from Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
    
        if (!token) {
            throw new ApiError(401, "Unauthorized Request!!!")
        }
    
        // verify token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token!!")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token!!")
    }
})