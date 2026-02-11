const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");

exports.updateCourseProgress = async (req, res) => {
    try {
        const { courseId, subsectionId } = req.body;
        const userId = req.user.id;

        if (!courseId || !subsectionId) {
            return res.status(400).json({
                success: false,
                message: "Course ID and SubSection ID are required",
            });
        }

        // Find or create course progress
        let courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        });

        if (!courseProgress) {
            courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completeVideos: [subsectionId],
            });
        } else {
            // Add subsection if not already present
            if (!courseProgress.completeVideos.includes(subsectionId)) {
                courseProgress.completeVideos.push(subsectionId);
                await courseProgress.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Course progress updated successfully",
            data: courseProgress,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update course progress",
            error: error.message,
        });
    }
}
