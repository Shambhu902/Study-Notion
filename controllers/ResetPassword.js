const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');

//reset password token
exports.resetPasswordToken = async(req, res) => {
    try{
        //fetch email from req body
        const email = req.body.email;
        //check user exists or not
        const user = await User.findOne({email: email});
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found with this email",
            });
        }
        //generate token
        const token = crypto.randomUUID();
        //adding user by adding token and expiry time 
        const updatedDetails = await User.findOneAndUpdate(
            {email: email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 5*60*1000, //5 minutes
            },
            {new: true}
        );
        //create url
        const url = `http://localhost:3000/reset-password?token=${token}`;

        //send mail
        await mailSender(email,
        "Password Reset Link from StudyNotion",
        `Click on the link to reset your password. This link is valid for 5 minutes only. <a href=${url}>Click Here</a>`
        );

        //return response
        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email successfully",
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending reset password link",
        });
    }
}

//reset password

exports.resetPassword = async(req, res) => {
    try{
        //fetch data from req body
        const {password, confirmPassword, token} = req.body;
        //validation
        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }
        //get userdetails from db using token
        const userDetails = await User.findOne({token: token});
        //if no user found
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: "User not found, invalid token",
            });
        }
        //token time check
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.status(400).json({
                success: false,
                message: "Token expired, please try again",
            });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //update password in db
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new: true},
        );
        //return response
        return res.status(200).json({
            success: true,
            message: "Password reset successfully, you can now login with your new password",
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting password",
        });
    }
}