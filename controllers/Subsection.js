const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//create Subsection
exports.createSubSection = async(req,res) => {
    try{
        //fetch data from req body
        const {sectionId, title, timeDuration, description} = req.body;
        //extract video file
        const video = req.files.videoFile;
        //vaildation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        //create a sub-section
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoURL:uploadDetails.secure_url,
        })
        //update section with sub-section id
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                               {$push:{
                                                                SubSections:subSectionDetails._id,
                                                               }},
                                                               {new:true});
        //return response
        return res.status(200).json({
            success:true,
            message:"Sub-section created and added to section successfully",
            updatedSection,
        });                                                       
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to create sub-section,please try again",
            error:error.message,
        })
    }
}
//update Subsection
exports.updateSubSection = async(req,res)=>{
    try{
        //data input
        const{subSectionId,title,description,timeDuration} = req.body;
        //data validation
        if(!subSectionId || !title || !description || !timeDuration){
            return res.status(400).json({
                success:false,
                message:"Missing properties",
            });
        }
        //update data
        const subSection = await SubSection.findByIdAndUpdate(subSectionId,
            {
                title:title,
                description:description,
                timeDuration:timeDuration,
            },
            {new:true}
            );
        //response
        return res.status(200).json({
            success:true,
            message:"Sub-section updated successfully",
            subSection,
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to update sub-section,please try again",
            error:error.message,
        })
    }
};

//delete Subsection
exports.deleteSubSection = async(req,res)=>{
    try{
        ////get ID-assuming that we are sending ID in params
        const {subSectionId, sectionId} = req.params;
        //delete sub-section
        await SubSection.findByIdAndDelete(subSectionId);
        //remove sub-section from section
        const updatedSection = await Section.findByIdAndUpdate(
            {_id:sectionId},
            {
                $pull:{
                    SubSections:subSectionId,
                },
            },
            {new:true}
        );
        //response
        return res.status(200).json({
            success:true,
            message:"Sub-section deleted successfully",
            updatedSection,
        });

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"unable to delete sub-section,please try again",
            error:error.message,
        })
    }
}