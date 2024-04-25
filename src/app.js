import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// app.use(cors()) // this will allow all the requests from all the origins
app.use(cors({
    origin: process.env.CORS_ORIGIN, // CORS_ORIGIN = * because we want to allow all the requests from all the origins for now 
    credentials: true
}))

app.use(express.json({ limit: "16kb" })) // limit the request body size from json files to 16kb 
app.use(express.urlencoded({ extended: true, limit: "16kb" })) // limit the request body size from url to 16kb
app.use(express.static("public")) // public folder is accessible to the public where we can store images or assets
app.use(cookieParser()) // to parse the cookies from the request


// routes import 
import userRouter from './routes/user.routes.js'


// routes declaration
app.use("/api/v1/users", userRouter)



export { app }