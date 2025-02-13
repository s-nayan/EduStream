const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
require("dotenv").config();

//createSubSection handler
exports.createSubSection = async (req,res) => 
{
    try{
        //data fetch
        const {sectionId, title, timeDuration, description} = req.body;
        //extract file/video
        const {video} = req.files.videoFile;
        //validate
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success:false,
                message:'All fields are required'
            });
        }

        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);

        //create sebsection
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })
        //updating in section
        const updatedSection = await Section.findByIdAndUpdate( {_id:sectionId},
            {
                $push:{
                    subSection:subSectionDetails._id,
                }
            },
            {new:true},
        )
        //return res
        return res.status(200).json({
            success:true,
            message:'Sub Section created successfully',
            updatedSection,
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Unable to create sub section. Try Again!',
            error:err.message,
        });
    }
}

//updateSubSection handler
exports.updateSubSection = async (req,res) => {
    try{
        //fetch data
        const {subSectionId, title, sectionId, description} = req.body;
        const subSection = await SubSection.findById(subSectionId)
        //validate data
        if (!subSection) {
            return res.status(404).json({
              success: false,
              message: "SubSection not found",
            })
          }
      
          if (title !== undefined) {
            subSection.title = title
          }
      
          if (description !== undefined) {
            subSection.description = description
          }
          if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
              video,
              process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
          }
      
          await subSection.save()
      
          // find updated section and return it
          const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
          )
      
          console.log("updated section", updatedSection)
      
          return res.json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,
          })

    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Unable to update  sub section. Try Again!',
            error:err.message,
        });
    }
}

//deleteSubSection handler
exports.deleteSubSection = async (req,res) => {
    try{
        const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    )
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    )

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Unable to delete sun section. Try Again!',
            error:err.message,
        });
    }
}