import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
    },
    fullName: {
        type: String,
        required: true,
        trim:true,
        index:true
    },
    password:{
        type:String,
        required:[true, 'Password is required']
    },
    avatar:{
        type:String, 
        default: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
    },
    coverImage:{
        type:String
    },
    token:{
        type:String,
    }
},
{
    timestamps:true
}
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10)
    next()
} )

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateToken = function(){
    // console.log("Generating Access Token");
    // console.log("Calling generateAccessToken for user: ", this.username);

    const temp = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    return temp
}

// userSchema.methods.generateRefreshToken = function(){
//     return jwt.sign(
//         {
//             _id: this._id,
//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         {
//             expiresIn: process.env.REFRESH_TOKEN_EXPIRY
//         }
//     )
// }



export const User = mongoose.model("User",userSchema);