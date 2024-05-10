import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }   // returning object with access and refresh token

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response


    const { fullName, email, username, password } = req.body
    // console.log("email: ", email);
    // console.log(req.body);

    // checking if any of the fields are empty using the some() method
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Please fill in all fields");
    }

    // checking if user is already existed in the database using findOne() method
    // and using "$or" operator to check if either the username or email already exists 
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);

    // Getting proper path uploaded by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // checking if coverImage file is uploaded then only we will get the path other wise it will be set to null
    let coverImageLocalPath;
    let coverImage;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    // checking if avatar file is uploaded
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // Upload the user to the database
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // if coverImage is not uploaded, then set it to empty string because it is not required in the schema
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // remove password and refresh token from the response
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
} )

const loginUser = asyncHandler( async (req, res) => {
    // get user details from frontend (req.body -> data)
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body
    console.log(req.body)
    console.log(email || "No email")
    console.log(password || "No password")
    
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    // Here is an alternative way of above code
    // if (!(username || email)) {
    //     throw new ApiError(400, "Username or email is required")
    // }

    // $or - mongoDB operator - takes objects as input and checks if any of the conditions are true
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user){
        throw new ApiError(404, "User not found")
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid){
        throw new ApiError(401, "Invalid credentials (Password is incorrect)")
    }

    // generate access token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookie

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
} )

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined
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
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

export { 
    registerUser,
    loginUser,
    logoutUser
}