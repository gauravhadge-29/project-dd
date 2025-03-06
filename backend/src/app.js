import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: ["http://localhost:5174","http://localhost:5173", "https://data-discovery1-idcq.vercel.app"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
}))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/users",userRouter)


export {app}