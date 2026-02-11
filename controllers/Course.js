const Course = require('../models/Course');
const Tag = require('../models/Category');
const User = require('../models/User');
const {uploadImageToCloudinary} = require('../utils/imageUploader');

//create course handler function
exports.createCourse = async (req, res) => {
    try{
        //fetch course data from req body
        const {courseName, courseDescription, whatYouWillLearn, price, tag} = req.body;
        //get thumbnail
        const thumbnail = req.files.thumbnailImage;
        
        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail){
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        //check instructor exists
        const userId = req.user.id;
        const instructorDetails = await User.findById(req.user.id);
        console.log("Instructor Details:", instructorDetails);
        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: "Instructor not found",
            });
        }
        //check given tag is valid or not
        const tagDetails = await Tag.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success: false,
                message: "Tag not found",
            });
        }
        //upload thumbnail to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create an entry for new course in DB
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tagDetails._id,
            thumbnail: thumbnailImage.secure_url,
        })
        //add new course to the user schema of instructor
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {$push: {courses: newCourse._id}},
            {new: true}
        );
        //update tag schema to add this course in it
        await Tag.findByIdAndUpdate(
            {_id: tagDetails._id},
            {$push: {courses: newCourse._id}},
            {new: true}
        );
        //return response
        return res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: newCourse,
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

//get all courses handler function
exports.getAllCourses = async (req, res) => {
    try{
        const allCourses = await Course.find({}, {courseName:true, 
                                                  price:true, 
                                                  thumbnail:true, 
                                                  instructor:true, 
                                                  ratingAndReviews:true, 
                                                  studentEnrolled:true,})
                                                  .populate("instructor")
                                                  .exec();
        return res.status(200).json({
            success: true,
            message: "All courses fetched successfully",
            data: allCourses,
        }); 
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try{
        //get id
        const {courseId} = req.body;
        //find course details
        const courseDetails = await Course.find(
                                    {_id: courseId})
                                    .populate(
                                        {
                                            path: "instructor",
                                            populate: {
                                                path: "additionalDetails",
                                            },
                                        }
                                    )
                                    .populate("tag")
                                    .populate("ratingAndReviews")
                                    .populate({
                                        path: "courseContent",
                                        populate: {
                                            path: "SubSection",
                                        },
                                    })
                                    .exec();
        //validation
        if(!courseDetails){
            return res.status(404).json({
                success: false,
                message: `Course not found for id: ${courseId}`,
            });
        }
        //return response
        return res.status(200).json({
            success: true,
            message: "Course details fetched successfully",
            data: courseDetails,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

exports.getFullCourseDetails = async (req, res) => {
    try {
        const {courseId} = req.body;
        const userId = req.user.id;

        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("tag")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "SubSection",
                },
            })
            .exec();

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Full course details fetched successfully",
            data: courseDetails,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch full course details",
            error: error.message,
        });
    }
}

exports.editCourse = async (req, res) => {
    try {
        const {courseId} = req.body;
        const updates = req.body;

        const course = await Course.findByIdAndUpdate(courseId, updates, {new: true})
            .populate("instructor")
            .populate("tag")
            .exec();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: course,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to edit course",
            error: error.message,
        });
    }
}

exports.getInstructorCourses = async (req, res) => {
    try {
        const userId = req.user.id;

        const instructorCourses = await Course.find({instructor: userId})
            .populate("instructor")
            .populate("tag")
            .exec();

        return res.status(200).json({
            success: true,
            message: "Instructor courses fetched successfully",
            data: instructorCourses,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch instructor courses",
            error: error.message,
        });
    }
}

exports.deleteCourse = async (req, res) => {
    try {
        const {courseId} = req.body;

        const course = await Course.findByIdAndDelete(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
            data: course,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete course",
            error: error.message,
        });
    }
}