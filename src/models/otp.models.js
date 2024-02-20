import mongoose, {Schema} from "mongoose";

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
        },
        otp : {
            type : String,
            required : true,
        },
        // timestamp: {
        //     default : Date.now(),
        // }

    },
    {
        timestamps : true,
    }
)


export const Otp = mongoose.model("Otp", otpSchema)