import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    refreshAccessToken,
    updateAccountDetails,
    resetPassword,
    mailVerification

} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()


router.route("/register").post(registerUser)

router.route("/login").post(loginUser)


//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").get(refreshAccessToken)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/forgot-password").post(verifyJWT,forgotPassword);
router.route("/reset-password").post(verifyJWT , resetPassword);

router.route("/email-confirmation?:url").get(mailVerification)

export default router