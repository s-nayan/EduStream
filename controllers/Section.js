const Section = require("../models/Section");
const Course = require("../models/Course");

//createSection handler
exports.createSection = async (req,res) => {
    try{

        //data fetch
        const {sectionName, courseId} = req.body;

        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:'Missing Properties',
            });
        }
        //create section
        const newSection = await Section.create({sectionName});
        //update courses
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent:newSection._id,
                }
            },
            {new:true},
        ).populate({
            path : "courseContent",
            populate:{
                path : "subSection",
            }
        }).exec();
        //return response
        return res.status(200).json({
            success:true,
            message:'Section Created Successfully',
            updatedCourseDetails,
        })
    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Unable to create section. Try Again!',
            error:err.message,
        });
    }
}

//updateSection handler
exports.updateSection = async (req,res) => {
    try{
        //fetch data
        const {sectionName, sectionId} = req.body;
        //validate data
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:'Missing Properties',
            });
        }
        //update section
        const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});
        //return res
        return res.status(200).json({
            success:true,
            message:'Section updated successfully',
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Unable to update section. Try Again!',
            error:err.message,
        });
    }
}

//deleteSection handler
exports.deleteSection = async (req,res) => {
    try{
        //data fetch - assuming that we are sending in params
        const {sectionId} = req.params;
        //delete section
        await Section.findByIdAndDelete(sectionId);
        //return res
        return res.status(200).json({
            success:true,
            message:'Section Deleted Successfully'
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Unable to delete section. Try Again!',
            error:err.message,
        });
    }
}