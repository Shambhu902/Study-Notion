const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
        required: true,
    },
    completeVideos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubSection',
        }
    ]
});

module.exports = mongoose.model("courseProgress", courseProgressSchema);