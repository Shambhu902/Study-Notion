const User = require('../models/User');
const OTP = require('../models/OTP');
const OtpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const {passwordUpdated} = require('../mail/templates/passwordUpadate');
const Profile = require('../models/profile');

//send OTP
exports.sendOTP = async(req, res) =>{
    try{
        //fetch email from req body
        const { email } = req.body;
        
        //check if user already exists
        const checkUserPresent = await User.findOne({email});

        //if user already exits then return response
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User already exists",
            });
        }
        //generate OTP
        var otp = OtpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        console.log("OTP generated: ", otp);

        //check unique OTP 
        
        let result = await OTP.findOne({otp: otp});

        while(result){
            otp = OtpGenerator.generate(6, {
                upperCaseAlphabets: false,
                specialChars: false,
                lowerCaseAlphabets: false,
            });
            result = await OTP.findOne({otp: otp});
        }
        
        const otpPayload = { email, otp };

        //create an entry for OTP in DB

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp,
        });


    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message:err.message,
        });
    }
}

//Signup 

exports.Signup = async(req,res) => {
    try{
        const{
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        //validation

        if(!firstName || !lastName || !email || !password || !confirmPassword || !accountType || !contactNumber || !otp){
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            });
        }

        //Match Passwords
        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        //check if user already exists 
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists, please login",
            });
        }
        //find most recent OTP stored in DB
        const recentOTP = await OTP.findOne({email}).sort({createdAt: -1}).limit(1);
        console.log(recentOTP);

        if(recentOTP.length === 0){
            return res.status(400).json({
                success: false,
                message: "OTP not found, please generate OTP again",
            });
        } else if(otp !== recentOTP.otp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP, please try again",
            });
        }
        //Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        //create user entry in DB
        
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/6.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        return res.status(200).json({
            success: true,
            message: "User signed up successfully",
            user: newUser,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "User signup failed, please try again",
        });
    }
}

//Login

exports.login = async(req,res) => {
    try{
        const { email, password } = req.body;
        
        if(!email || !password){
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            });
        }

        const userDetails = await User.findOne({email}).populate("additionalDetails");

        if(!userDetails){
            return res.status(401).json({
                success: false,
                message: "User not found, please signup",
            });
        }

        if(await bcrypt.compare(password, userDetails.password)){
            const payload = {
                email: userDetails.email,
                id: userDetails._id,
                accountType: userDetails.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '24h'});

            userDetails.token = token;
            userDetails.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                message: "User logged in successfully",
                token,
                user: userDetails,
            });
        }
        else{
            return res.status(401).json({
                success: false,
                message: "Invalid credentials, please try again",
            });
        }    
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "User login failed, please try again",
        });
    }
};

exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
};