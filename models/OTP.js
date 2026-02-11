const mongoose = require('mongoose');
const { create } = require('./CourseProgress');
const mailSender = require('../utils/mailSender');
const OTPSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
    },
    otp:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
        expires: 300, // OTP expires in 5 minutes
    }
});

//function to send email
async function sendVerificationEmail(email, otp) {
    try{
        const mailResponse = await mailSender(email, "Verification from StudyNotion", otp);
        console.log("Email sent SuccessFully", mailResponse);
    }
    catch(err){
        console.log("error occured while sending mails: ",err);
    }
}

OTPSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email, this.otp);
    next();
})

module.exports = mongoose.model('OTP', OTPSchema);
