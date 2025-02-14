const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

//create rating and reviews
exports.createRating = async (req,res) => {
    try{
        //get user id
        const userId = req.user.id;
        //fetch data
        const {rating,review,courseId} = req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findOne({_id:courseId,
            studentEnrolled:{$eleMatch : {$eq : userId}},
        });
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:"Student is not enrolled in the course",
            })
        }
        //check if user already given rating or review
        const alreadyReviewed = await RatingAndReview.findOne({
            user:userId,
            course:courseId,
        });
        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message:"Course already reviwed by user",
            })
        }
        //create rating and review
        const ratingReview = await RatingAndReview.create({
            rating:rating,
            course:courseId,
            user:userId,
        });
        //update course with this rating and review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
            {
                $push:{
                    ratingAndReviews:ratingReview._id,
                }
            },
            {new:true}
        );
        //return res
        return res.status(200).json({
            success:true,
            message:"Rating and Review created successfully ",
            ratingReview,
        })

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}

//getAverageRating
exports.getAverageRating = async (req,res) =>{
    try{
        //get courseId
        const courseId = req.body.courseId;
        //calculate avg ratiing
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating: {$avg:"$rating"},
                },
            },
        ])
        //return rating
        if(result.length > 0){
            return res.status(200).json({
                success:true,
                averageRating: result[0].averageRating,
            })
        }
        //if no rating/review
        return res.status(200).json({
            success:true,
            message:"No rating given till now",
            averageRating:0,
        })

    }catch(err){
        return res.status(404).json({
            success:false,
            message:err.message,
        })
    }
}

//getAllRating&Review
exports.getAllRating = async (req,res) => {
    try{

        const allReview = await RatingAndReview.find({}).sort({rating:"desc"}).populate({
            path:"user",
            select:"firstName lastName email image",
        }).populate({
            path:"course",
            select:"courseName",
        }).exec();
        
        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allReview,
        });


    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}