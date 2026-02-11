const Tag = require('../models/Category');
const Course = require('../models/Course');

//create tag handler function
exports.createCategory = async (req, res) => {
    try{
        //fetch tag data from req body
        const { name, description} = req.body;
        //validation
        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: "Name and Description are required",
            });
        }
        //create tag entry in DB
        const tagDetails = await Tag.create({
            name:name,
            description:description,
        });
        console.log(tagDetails);
        //return response
        return res.status(200).json({
            success: true,
            message: "Tag created successfully",
            tagDetails,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
            })
        }
};

//get all tags handler function
exports.showAllCategories = async (req, res) => {
    try{
        const allTags = await Tag.find({}, {name:true, description:true});
        res.status(200).json({
            success: true,
            message: "Tags fetched successfully",
            data: allTags,
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

exports.categoryPageDetails = async (req, res) => {
    try{
        //get categoryId
        const {categoryId} = req.body;
        //get courses for specific categoryId
        const selectedCategory = await Tag.findById(categoryId)
                                            .populate("course")
                                            .exec();
        //validation
        if(!selectedCategory){
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        //get courses for different category
        const differentCategories = await Tag.find(
                                        {_id: {$ne: categoryId}})
                                        .populate("course")
                                        .exec();   
        //get top selling courses
        const topSellingCourses = await Course.find({})
                                              .sort({studentEnrolled: "desc"})
                                              .limit(10)
                                              .populate("instructor")
                                              .exec();                                  
        //return response
        return res.status(200).json({
            success: true,
            message: "Category page details fetched successfully",
            data: {
                selectedCategory,
                differentCategories,
                topSellingCourses,
            },
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