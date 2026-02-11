const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const {paymentSuccessEmail} = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const mongoose = require("mongoose");

//capture payment and initiate razorpay order
exports.capturePayment = async (req, res) => {
    //get courseId or userId from req body
    const {courseId} = req.body;
    const userId = req.user.id;
    //validation
    //valid courseID
    if(!courseId){
        return res.status(400).json({
            success:false,
            message:"Course ID is required",
        });
    };
    //valid courseDetail
    let course;
    try{
        course = await Course.findById(courseId);
        if(!course){
            return res.json({
                success:false,
                message:"Course not found",
            });
        }
        //user already pay for the course
        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentEnrolled.includes(uid)){
            return res.status(200).json({
                success:false,
                message:"User already enrolled in the course",
            });
        }
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            error:error.message,
        });
    }
//order create
const amount = course.price;
const currency = "INR";
const options = {
    amount: amount*100,
    currency,
    receipt: Math.random(Date.now()).toString(),
    notes:{
        courseId:courseId,
        userId,
    }
};
try{
    //initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    //return response
    return res.status(200).json({
        success:true,
        courseName:course.courseName,
        courseDescription:course.courseDescription,
        thumbnail:course.thumbnail,
        orderId: paymentResponse.id,
        currency: paymentResponse.currency,
        amount: paymentResponse.amount,
    });
}
catch(error){
    console.error(error);
    return res.status(500).json({
        success:false,
        message:"Unable to initiate payment",
        error:error.message,
    });
}
};

//SHA - secure hashing algorithm
//HMAC - hash based message authentication code =>hashing algorithm + secret key

//verify signature of Razorpay and Server

exports.verifyPayment = async (req,res) => {
    //Razorpay webhook secret key
    const webhookSecret = "12345678";
    const signature = req.headers["x-razorpay-signature"];
    const shasum = crypto.createHmac("sha256",webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest){
        console.log("Payment is authorised");

        const {courseId, userId} = req.body.payload.payment.entity.notes;

        try{
            //enroll the user in the course
            const enrolledCourse = await Course.findByIdAndUpdate(
                {_id:courseId},
                {
                    $push:{studentEnrolled: userId},
                },
                {new:true}
            );

            console.log("User enrolled successfully");
            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:"Unable to enroll user in the course, please contact support",
                });
            }
            console.log(enrolledCourse);
            //find student and add course to their enrolled courses
            const enrolledStudent = await User.findByIdAndUpdate(
                {_id:userId},
                {
                    $push:{courses: courseId},
                },
                {new:true}
            );
            console.log(enrolledStudent);

            //send course enrollment email to the student
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulations! You are enrolled in a new course",
                courseEnrollmentEmail(
                    enrolledStudent.firstName,
                    "Congratulations on enrolling in a new course. You can now access the course materials and start learning!",
                    "Course Enrollment Successful",
                )
            );
            console.log("Email sent successfully:", emailResponse.response);

            console.log(emailResponse);
            
            return res.status(200).json({
                success:true,
                message:"Payment verified and user enrolled successfully",
            });
        }
        catch(error){
            console.error(error);
            return res.status(500).json({
                success:false,
                message:"Unable to enroll user in the course, please contact support",
                error:error.message,
            });
        }
    }
    else{
        return res.status(400).json({
            success:false,
            message:"Invalid request",
        });
    }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
    const {orderId, paymentId, amount} = req.body;
    const userId = req.user.id;
    
    try{
        const user = await User.findById(userId);
        await mailSender(
            user.email,
            "Payment Successful",
            paymentSuccessEmail(user.firstName, amount, orderId, paymentId)
        );
        
        return res.status(200).json({
            success: true,
            message: "Payment success email sent",
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}