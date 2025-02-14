const Profile = require("../models/Profile")
const CourseProgress = require("../models/CourseProgress")

const Course = require("../models/Course")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const mongoose = require("mongoose");

//updateProfile handler
exports.updateProfile = async (req,res) => {
    try{
        //get data
        const {dateOfBirth="", about="",contactNumber, gender} = req.body;
        //get user Id
        const Id = req.user.id;
        //validation
        if(!contactNumber || !gender || !id){
            return res.status(400).json({
                success:false,
                message:'Please fill required fields',
            });
        }
        //find profile
        const userDetails = await User.findById(Id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        //update profile
        profileDetails.dataOfBirth = dateOfBirth;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        profileDetails.about = about;
        await profileDetails.save();
        //return res
        return res.status(200).json({
            success:true,
            message:'Profile Updated Suv=ccessfully',
            profileDetails,
        })

    }catch{
        return res.status(500).json({
            success:false,
            message:'Errro in updating profile',
        })
    }
}

//deleteAccount handler
exports.deleteAccount = async (req,res) => {
    try{

        //get id
        const id = req.user.id;
        //validation
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:'User not found',
            })
        }
        // Delete Assosiated Profile with the User
        await Profile.findByIdAndDelete({
        _id: new mongoose.Types.ObjectId(user.additionalDetails),
        })
        for (const courseId of user.courses) {
            await Course.findByIdAndUpdate(
            courseId,
             { $pull: { studentsEnroled: id } },
            { new: true }
            )
        }
        //delete profile
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});
        //delete user
        await User.findByIdAndDelete({_id:id});
        //return res
        return res.status(200).json({
            success:true,
            message:'Account Deleted Successfully',
        })

    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Errro in deleting account',
        })
    }
}

//getAllUserDetails

exports.getAllUserDetails = async (req,res) => {
    try{
        //get id
        const id =req.user.id;
        //validation and get user details
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        return res.status(200).json({
            success:true,
            message:'User data fetched successfully',
        })


    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Errro in fetching user details',
        })
    }
}