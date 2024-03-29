import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.modle.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import mailHelper from "../utils/MailHelper.js";
import { Otp } from "../models/otp.models.js";
import { request } from "express";
import cryptoRandomString from 'crypto-random-string';

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const randomUrl = cryptoRandomString({length: 10, type: 'base64'});

const registerUser = asyncHandler( async (req, res) => {
    const {name ,email, password } = req.body

    if (
        [name, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({email})

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // TODO: Verify user through email.

    // const link = `http://localhost:${process.env.PORT}/user/email-confirmation?:${randomUrl}`;

    // mailHelper(email, "Verification Link",link);
    // console.log(req.url , " " , link)


    // if(req.url === `/email-confirmation?:${randomUrl} `) {
    //     console.log("Email confirmed ")
    // }


    

    const user = await User.create({
        name,
        email, 
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const mailVerification = asyncHandler( async (req, res) => {

    console.log("url ",req.url)

    return req.url
})

const loginUser = asyncHandler(async (req, res) =>{

    const {email, password} = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }
    

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const { name, email} = req.body

    if (!name || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                name,
                email,
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const forgotPassword = asyncHandler(async(req, res) => {
    const { to  } = req.body;

    const user = await User.findById(req.user._id);

    if(user.email != to) {
        throw new ApiError (402," Invalid User ")
    }

    const otpGenerator =  Math.floor(Math.random() *1000000)

    mailHelper(to ,"Otp For Reset Password", `Otp : ${otpGenerator}`);

    const email = req.user.email;

    const isOtp = await Otp.findOneAndDelete({email})

    const otp = await Otp.create({
        email: req.user.email,
        otp : otpGenerator,
    })


    return res
    .status(200)
    .json(
        new ApiResponse(200 , " Email Sent Successfully",otp)
    )
})

const resetPassword = asyncHandler(async(req, res) => {
    const {otp , newPassword} = req.body

    const email = req.user.email;
    const otpFromDb = await Otp.findOne({email})

    if(otpFromDb.otp != otp) {
        throw new ApiError(405,"Invalid OTP")
    }

      //Otp is valid for 15 Minutes 
    if((otpFromDb.updatedAt.getTime()+900000) < Date.now()) {
        throw new ApiError(403, "Otp Time Out ! Please try again")
    }



    const user = await User.findById(req.user?._id)

    if (!newPassword && !otp) {
        throw new ApiError(400, "Fill password and Otp  fields")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})


    await Otp.findByIdAndDelete(otpFromDb._id)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})






export {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    refreshAccessToken,
    updateAccountDetails,
    resetPassword,
    mailVerification
}