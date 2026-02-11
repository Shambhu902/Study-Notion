const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

//auth
exports.auth = async(req, res, next) => {
    try{
        //extract token
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");

        //if token missing, then return response
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token missing, unauthorized access",
            });
        }
        //verify token
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded token: ", decode);
            req.user = decode;
        }
        catch(err){
            //verification failed
            return res.status(401).json({
                success: false,
                message: "Token verification failed, unauthorized access",
            });
        }
        next();
    }
    catch(err){
        return res.status(401).json({
            success: false,
            message: "Something went wrong in auth middleware",
        });
    }
}

//isStudent
exports.isStudent = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success: false,
                message: "This is a protected route for students only",
            });
        }
        next();
    }
    catch(err){
        return res.status(401).json({
            success: false,
            message: "Something went wrong in student middleware",
        });
    }
}

//isInstructor
exports.isInstructor = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success: false,
                message: "This is a protected route for instructors only",
            });
        }
        next();
    }
    catch(err){
        return res.status(401).json({
            success: false,
            message: "Something went wrong in instructor middleware",
        });
    }
}
//isAdmin
exports.isAdmin = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success: false,
                message: "This is a protected route for admins only",
            });
        }
        next();
    }
    catch(err){
        return res.status(401).json({
            success: false,
            message: "Something went wrong in admin middleware",
        });
    }
}