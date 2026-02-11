const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName:{
        type: String,
        trim: true,
        required: true,
    },
    courseDescription:{
        type: String,
        trim: true,
        required: true,
    },
    instructor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    whatYouWillLearn:{
        type: String,
    },
    courseContent:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
    }],
    ratingAndReviews:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ratingAndReview',
    }],
    price:{
        type: Number,
        required: true,
    },
    thumbnail:{
        type: String,
        required: true,
    },
    tag:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tag',
    },
    studentEnrolled:[{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    }],
});
module.exports = mongoose.model("course", courseSchema);