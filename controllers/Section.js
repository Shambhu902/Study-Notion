const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
    try{
        //fetch data
        const { courseId, sectionName } = req.body;
        //validation
        if(!sectionName || !courseId){
            return res.status(400).json({
            success:false,
            message:"All fields are required",

        });

    }
        //create section
        const newSection = await Section.create({sectionName});
        //update course with section objectId
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                           courseId,
                                           {
                                            $push:{
                                                courseContent:newSection._id,
                                            }
                                           },
                                           {new:true},
                                        );
        // use populate to replace section/sub-sections both in the updatedCourseDetails                              
                                        
        //return response
        return res.status(200).json({
            success:true,
            message:'section created successfully',
            updatedCourseDetails,
        })
}
catch(error){
    return res.status(500).json({
        success:false,
        message:"unable to create section,please try again",
        error:error.message,
    })
}
};

exports.updateSection = async(req,res)=>{
    try{
        const{sectionName,sectionId} = req.body;
        
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:"Missing properties",
            });
        }
        
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName},{new:true});

        return res.status(200).json({
            success:true,
            message:'section updated successfully',
            updatedCourseDetails: section,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to update section,please try again",
            error:error.message,
        });
    }
}

exports.deleteSection = async(req,res) => {
    try{
        const {sectionId} = req.body;
        
        await Section.findByIdAndDelete(sectionId);

        return res.status(200).json({
            success:true,
            message:'section deleted successfully',
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to delete section,please try again",
            error:error.message,
        });
    }
}