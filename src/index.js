import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})
import connectDB from "./db.js "
import { app } from "./server.js"

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})



