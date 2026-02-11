const Profile = require('../models/profile');
const User = require('../models/User');
const {uploadImageToCloudinary} = require("../utils/imageUploader");

exports.updateProfile = async (req, res) => {
    try{
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;
        const userId = req.user.id;
        
        if(!contactNumber || !gender || !userId){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }
        
        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about; 
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        
        await profileDetails.save();
        
        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            profileDetails,
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to update profile,please try again",
            error:error.message,
        })
    }
}

//delete Account
exports.deleteAccount = async (req,res) => {
    try{
        //get id
        const id = req.user.id;
        //validation
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:"User not found",
            });
        }
        //delete profile
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});
        //unenroll user from all courses - to be implemented later
        
        //delete user
        await User.findByIdAndDelete({_id:id});
        //return response
        return res.status(200).json({
            success:true,
            message:"User account deleted successfully",
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to delete account,please try again",
            error:error.message,
        })
    }
}

exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id
    //validation and fetch user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()
    console.log(userDetails)
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
        const {displayPicture} = req.files;
        const userId = req.user.id;
        
        if (!displayPicture) {
            return res.status(400).json({
                success: false,
                message: "Display picture is required",
            });
        }

        const user = await User.findById(userId);
        const uploadDetails = await uploadImageToCloudinary(displayPicture, process.env.FOLDER_NAME);
        
        const updatedUser = await User.findByIdAndUpdate(userId, 
            {image: uploadDetails.secure_url},
            {new: true}
        );

        return res.status(200).json({
            success: true,
            message: "Display picture updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update display picture",
            error: error.message,
        });
    }
}

exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userDetails = await User.findById(userId)
            .populate("courses")
            .exec();

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Enrolled courses fetched successfully",
            data: userDetails.courses,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch enrolled courses",
            error: error.message,
        });
    }
}

exports.instructorDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const courseDetails = await User.findById(userId)
            .populate({
                path: "courses",
                populate: {
                    path: "studentEnrolled",
                },
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "Instructor dashboard data fetched successfully",
            data: courseDetails,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch instructor dashboard",
            error: error.message,
        });
    }
}
