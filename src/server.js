import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json())

app.use(express.urlencoded({ extended : true , limit : "30kb"}))
app.use(cookieParser())


import userRouter from './routes/user.routes.js'

app.use('/user',userRouter)



export { app }