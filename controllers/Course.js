const Course = require("../models/Course")
const Category = require("../models/Category")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")
const e = require("express")
require("dotenv").config();

//createCourse handler 
exports.createCourse = async (req,res) => {
    try{
        //fetch data
        const {courseName, courseDescription, whatYouWillLearn, price, tag: _tag,
            category,
            status,
            instructions: _instructions,} = req.body;
        // Convert the tag and instructions from stringified Array to Array
        const tag = JSON.parse(_tag)
        const instructions = JSON.parse(_instructions)

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag.length || !thumbnail || !category   ||!instructions.length){
            return res.status(400).json({
                success:false,
                message:'All fields are manditory',
            });
        }
        if (!status || status === undefined) {
            status = "Draft"
        }
        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId , {
            accountType:"Instructor",
        });
        console.log("Instructor Details:", instructorDetails);

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:'Instructor Details not found'
            });
        }

        //check given tag is valid or not
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails){
            return res.status(404).json({
                success:false,
                message:'Category deatils not found'
            });
        }

        //upload Image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions,
        })

        //add the new course to user schema of instructor
        await User.findByIdAndUpdate(
            {_id : instructorDetails._id},
            {
                $push:{
                    courses: newCourse._id,
                }
            },
            {new:true},
        )

        //update the Tag schema
        await Category.findByIdAndUpdate(
            {_id : categoryDetails._id},
            {
                $push:{
                    course: newCourse._id,
                }
            },
            {new:true},
        )

        //return response
        return res.status(200).json({
            success:true,
            message:"Course Created Successfully",
            data:newCourse,
        });


    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:"Error in creating course",
            error:err.message,
        });
    }
}

//getAllCourses handler
exports.getAllCourses = async (req,res) => {
    try{
        const allCourses = await Course.find({status:"Published"},{courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            ratingAndReviews:true,
            studentEnrolled:true,
        }).populate("instructor").exec();

        return res.status(200).json({
            success:true,
            message:'All courses are fetched successfully',
            data:allCourses,
        })

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:'Error in fetching all courses',
            error:err.message,
        })
    }
}

//getCourseDetails
exports.getCourseDetails = async (req,res) => {
    try{
        //get id
        const {courseId} = req.body;
        //find course details
        const courseDetails = await Course.findById({_id:courseId}).populate({
            path:"instructor",
            populate:{
                path:"additionalDetails",
            },
        }).populate("category").populate("ratingAndreviews").populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        }).exec();

        //validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`,
            })
        }
        //return res
        return res.status(200).json({
            success:true,
            message:"course details fetched successfully",
            data:courseDetails,
        })

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}

//Edit Course Details
exports.editCourse = async (req,res) => {
    try{

        //fetch 
        const {courseId} = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);

        if(!course){
            return res.status(404).json({
                success:false,
                message:"Course not found",
            });
        }

        //thumbnail image is updated
        if(req.files){
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
            course.thumbnail = thumbnailImage.secure_url;
        }

        await course.save();

        const updatedCourse = await Course.findOne({_id:courseId}).populate({
            path: "instructor",
            populate: {
              path: "additionalDetails",
            },
          })
          .populate("category")
          .populate("ratingAndReviews")
          .populate({
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          })
          .exec();
        return res.status(200).json({
            success:true,
            message:"Course Updated Successfully",
            data:updatedCourse,
        });

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:"Error in editing course",
            error:err.message,
        });
    }
}

//deleteCourse
exports.deleteCourse = async (req,res) => {
    try{
        //fetch
        const {courseId} = req.body;
        const course = await Course.findById(courseId);

        if(!course){
            return res.status(404).json({
                success:false,
                message:"Course not found",
            });
        }
        // Unenroll students from the course
        const studentsEnrolled = course.studentEnrolled
        for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
        })}

        // Delete sections and sub-sections
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
            const subSections = section.subSection
            for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
            }
        }

        // Delete the section
        await Section.findByIdAndDelete(sectionId)
        }

        //delete course
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success:true,
            message:"Course Deleted Successfully",
        });
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:"Error in deleting course",
            error:err.message,
        }); 
    }
}

//getInstructorCourses
exports.getInstructorCourses = async (req,res) => {
    try{
        //fetch
        const userId = req.user.id;
        const instructorCourses = await Course.find({instructor:userId},{courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            ratingAndReviews:true,
            studentEnrolled:true,
        }).populate("instructor").exec();

        return res.status(200).json({
            success:true,
            message:"Instructor courses fetched successfully",
            data:instructorCourses,
        });

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:"Error in fetching instructor courses",
            error:err.message,
        });
    }
}
