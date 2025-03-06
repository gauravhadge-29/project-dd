import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const generateToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        // console.log(user)
        const token = user.generateToken()
        
        // console.log("Generated access Token: ",accessToken)
        // console.log("Generated refresh Token: ",refreshToken)

        user.token = token
        await user.save({validateBeforeSave: false}) 

        
        return {token}


    } catch (error) {
        throw new ApiError(500, "Sometthing Went wrong while generating access Token")
    }
}

const registerUser = asyncHandler( async (req,res)=>{
 //steps
//get user details from front end
//validation
//check if user already exist
//checl for images, avatar
//upload them to cloudinary , avatar
//create user object -create entry in ddb
//remove password and refresh token from response
//check for user creation
//return res 




const {fullName,email,username,password} = req.body

console.log(req.body)
//console.log("Email : ", email);

//validation
// if(fullName===""){
//     throw new ApiError(400, "Full name is required")
// }

if ([fullName,email,username,password].some((field)=>
        (field?.trim()===""))
) {
    throw new ApiError(400,"All fields are required..")
}

const existedUser = await User.findOne({
    $or: [{ username }, { email }]
})

if (existedUser) {
    throw new ApiError(409,"username or email already exists")
}

// const avatarLocalPath = req.files?.avatar[0]?.path;
// let coverImageLocalPath ;

// if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
//     coverImageLocalPath = req.files.coverImage[0].path
// }

// if(!avatarLocalPath){
//     throw new ApiError(400,"Avatar File is required");
// }



// const avatar = await uploadOnCloudinary(avatarLocalPath)
// const coverImage  = await uploadOnCloudinary(coverImageLocalPath)

// if(!avatar){
//     throw new ApiError(400,"Avatar file is required");
// }

const user = await  User.create({
    fullName,
    email,
    password,
    username: username
})

const createdUser  = await User.findById(user._id).select(
    "-password "
)

if (!createdUser) {
    throw new ApiError(500,"Something went wrong while registering user")
}

return res.status(201).json(
    new ApiResponse(200, createdUser , "User registered Successfully")
)


})

const loginUser = asyncHandler(async (req,res) => {
    //take data from req.body
    //username or email
    //find the user
    //password check
    //access and refresh token generate
    //send cookies
    //return response


    const {email, username, password} = req.body
    
    if(!username || !email){
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }
    }


    const user= await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Creditianls")
    }

    console.log("Password Verified")

    const {token} = await generateToken(user._id)
    // console.log("Access and refresh tokens: ",accessToken,refreshToken)

    const loggedInUser = await User.findById(user._id).select("-password")
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }


    return res
    .status(200)
    .cookie("token",token,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, token
            },
            "User logged In Successfully"
        )
    )
   
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                token: 1
            }
        },{
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("token",options)
    .json( new ApiResponse (200,{}, "User Logged out successfully"))

})

const loginWithGoogle = asyncHandler(async (req, res) => {
    const { fullName, email, avatar } = req.body;
    console.log(req.body)

    if (!email) {
        throw new ApiError(400, "Google login failed, missing data");
    }

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            fullName,
            email,
            username: email.split("@")[0], // Generate a default username
            avatar,
            provider: "google", // Track that it's a Google login
        });
    }

    console.log("User found/created: ", user);

    const { token } = await generateToken(user._id);
    console.log("Generated Token: ", token);

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    return res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json(new ApiResponse(200, { user, token }, "Google login successful"));
});


// const refreshAccessToken = asyncHandler(async (req,res)=>{
//     const incomingRefreshToken = req.cookies.accessToken || req.body.refreshToken

//     if(!incomingRefreshToken){
//         throw new ApiError(401,"Unauthorized Access")
//     }

//     try {
//         const decodedToken = jwt.verify(
//             incomingRefreshToken, 
//             process.env.REFRESH_TOKEN_SECRET
//         )
    
//         const user  = await User.findById(decodedToken?._id)
    
//         if(!user){
//             throw new ApiError(401,"Invalid Refresh Token")
//         }
        
//         if(incomingRefreshToken!==user?.refreshToken){
//             throw new ApiError(401, "Refresh Token Expired")
//         }
    
//         const options = {
//             httpOnly:true,
//             secure:true
//         }
    
//         const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
//         return res
//         .status(200)
//         .cookie("accessToken",accessToken, options)
//         .cookie("refreshToken",newrefreshToken, options)
//         .json(
//             new ApiResponse(
//                 200,
//                 {accessToken, refreshToken: newrefreshToken},
//                 "Access Token Refreshed"
//             )
//         )
//     } catch (error) {
//         throw new ApiError(401, error?.message || " Invalid Refresh Token")
//     }

// })

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user  = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400, "Password Incorrect")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed Successfully"
        )
    )
})

// const updateAccountDetails = asyncHandler( async(req,res)=>{
//     const {fullName,email } = req.body

//     if(!fullName || !email){
//         throw new ApiError(400,"All fields are required")
//     }

//     const user = await User.findByIdAndUpdate(
//     req.user?._id,
//     {
//         $set:{
//             fullName,
//             email: email
//         }
//     },
//     {new: true}
//     ).select("-password")

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200,user,"Account Details Updated")
//     )

// })

const getCurrentUser = asyncHandler(async(req,res)=>{
    console.log("Current User: Request came")
    return res
    .status(200)
    .json(
        new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
        )
    )
})

// const updateUserAvatar = asyncHandler(async(req,res)=>{
//     const avatarLocalPath = req.file?.path

//     if(!avatarLocalPath){
//         throw new ApiError(400, "Avatar File is missing")
//     }

//     const avatar = await uploadOnCloudinary(avatarLocalPath)

//     if(!avatar.url){
//         throw new ApiError(400, "Error while uploading ")
//     }

//     const user= await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set:{
//                 avatar: avatar.url
//             }
//         },
//         {new:true}
//     ).select(-"password")

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             user,
//             "Avatar Image updated successfully"
//         )
//     )

// })

// const updateUserCoverImage = asyncHandler(async(req,res)=>{
//     const coverImageLocalPath = req.file?.path

//     if(!avatarLocalPath){
//         throw new ApiError(400, "Cover Image File is missing")
//     }

//     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

//     if(!coverImage.url){
//         throw new ApiError(400, "Error while uploading ")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set:{
//                 coverImage: coverImage.url
//             }
//         },
//         {new:true}
//     ).select(-"password")

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             user,
//             "Cover Image updated successfully"
//         )
//     )
// })

// const getCurrentUserProfile = asyncHandler(async(req,res)=>{
//     const {username}  = req.params

//     if(!username?.trim()){
//         throw new ApiError(400,"Username is required")
//     }

//     const channel = await User.aggregate([
//         {
//             $match:{
//                 username: username?.toLowerCase()
//             }
//         },
//         {
//             $lookup:{
//                 from:"subscriptions",
//                 localField: "_id",
//                 foreignField: "channel",
//                 as: "subscribers"
//             }
//         },
//         {
//             $lookup:{
//                 from:"subscriptions",
//                 localField:"_id",
//                 foreignField: "subscriber",
//                 as: "subscribedTo"
//             }
//         },{
//             $addFields:{
//                 subscriberCount: {
//                     $size: "$subscribers"
//                 },
//                 channelssubscriberToCount: {
//                     $size: "$subscribedTo"
//                 },
//                 isSubscribed:{
//                     $cond: {
//                         if: {$in: [req.user?._id, "$subscribers.subscriber"]},
//                         then: true,
//                         else: false

//                     }
//                 }

//             }
//         },{
//             $project:{
//                 fullName: 1,
//                 username: 1,
//                 subscriberCount: 1,
//                 channelssubscriberToCount:1,
//                 isSubscribed:1,
//                 avatar:1,
//                 coverImage:1,
//                 email:1
//             }
//         }
//     ])


//     if(!channel?.length){
//         throw new ApiError(404, "channel does not exist")
//     }

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200, channel[0], "User channel fetched successfully")
//     )
// }
// )

// const getWatchHistory= asyncHandler(async (req,res) => {
//     const user = await User.aggregate([
//         {
//             $match:{
//                 _id:new mongoose.Types.ObjectId(req.user._id)
//             }
//         },
//         {
//             $lookup:{
//                 from:"videos",
//                 localField:"watchHistory",
//                 foreignField:"_id",
//                 as:"watchHistory",
//                 pipeline:[
//                     {
//                         $lookup:{
//                             from:"users",
//                             localField:"owner",
//                             foreignField:"_id",
//                             as:"owner",
//                             pipeline:[
//                                 {
//                                     $project:{
//                                         fullName: 1,
//                                         username:1,
//                                         avatar:1
//                                     }
//                                 }
//                             ]
//                         }
//                     }
//                 ]
//             }
//         }
//     ])

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             user[0].watchHistory,
//             "Watch History fetched successfully"
//         )
//     )
// })

export {loginWithGoogle,registerUser, loginUser, logoutUser,changeCurrentPassword,getCurrentUser }





