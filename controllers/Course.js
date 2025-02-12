const Course = require("../models/Course");
const Tag = require("../models/tags");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
require("dotenv").config();

//createCourse handler 
exports.createCourse = async (req,res) => {
    try{
        //fetch data
        const {courseName, courseDescription, whatYouWillLearn, price, tag} = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag){
            return res.status(400).json({
                success:false,
                message:'All fields are manditory',
            });
        }

        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById({userId});
        console.log("Instructor Details:", instructorDetails);

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:'Instructor Details not found'
            });
        }

        //check given tag is valid or not
        const tagDetails = await Tag.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success:false,
                message:'Tag deatils not found'
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
            tag:tagDetails._id,
            thumbnail: thumbnailImage.secure_url,
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
        await Tag.findByIdAndUpdate(
            {_id : tagDetails._id},
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
exports.showAllCourses = async (req,res) => {
    try{
        const allCourses = await Course.find({},/*{courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            ratingAndReviews:true,
            studentEnrolled:true,
        }*/).populate("instructor").exec();

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