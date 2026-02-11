const RatingAndReviews = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { CURSOR_FLAGS } = require("mongodb");
const { default: mongoose } = require("mongoose");

//create rating 
exports.createRating = async (req, res) => {
    try{
        //get userId from req.user
        const userId = req.user.id;
        //fetch data from req body
        const {rating, review, courseId} = req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
                                           {_id: courseId,
                                            studentEnrolled: {$elemMatch: {$eq: userId}},
                                           });
        if(!courseDetails){
            return res.status(403).json({
                success: false,
                message: "User not enrolled in the course",
            });
        }
        //check if user has already given review
        const alreadyReviewed = await RatingAndReviews.findOne(
                                            {course: courseId,
                                             user: userId,
                                            });  
        if(alreadyReviewed){
            return res.status(403).json({
                success: false,
                message: "User has already given review for this course",
            });
        }
        //create rating and review
        const ratingReview = await RatingAndReviews.create({
            rating,review,
            user: userId,
            course: courseId,
        });
        //update course with rating and review
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId,
                                       {
                                        $push: {
                                            ratingAndReviews: ratingReview,
                                        }
                                 },
                                        {new: true});
        console.log("Updated Course Details:", updatedCourseDetails);
        //return response
        return res.status(200).json({
            success: true,
            message: "Rating and Review added successfully",
            data: ratingReview,
        });                                                                                                 
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Unable to add rating and review, please try again",
            error: error.message,
        });
    }
}

//get average rating 
exports.getAverageRating = async (req, res) => {
    try{
        //get courseId from req.body
        const courseId = req.body.courseId;
        //calculate average rating using aggregation
        const result = await RatingAndReviews.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: {$avg: "$rating"},
                },
            },
        ]);
        //return rating
        if(result.length > 0){
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }
        //return response
        return res.status(200).json({
            success: true,
            message: "Average rating fetched successfully",
            data: result,
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch average rating, please try again",
            error: error.message,
        });
    }
}
//get all ratings and reviews for a course
exports.getAllRating = async (req, res) => {
    try{
        const allReviews = await RatingAndReviews.find({})
                                                 .sort({rating: "desc"})
                                                 .populate({
                                                    path: "user",
                                                    select: "firstName lastName email image",
                                                 })
                                                 .populate({
                                                    path: "course",
                                                    select: "courseName",
                                                 })
                                                 .exec();
        return res.status(200).json({
            success: true,
            message: "All Reviews fetched successfully",
            data: allReviews,
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch reviews, please try again",
            error: error.message,
        });
    }
}