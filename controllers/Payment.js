const { default: mongoose } = require("mongoose");
const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require('mongoose');
//import templete of courseEnrolllmentEmail

//capture the payment and initiate the razorpay order

exports.capturePayment = async (req,res) => {
    try{

        //get course id and user id
        const {course_id} = req.body;
        const userId = req.user.id;
        //validation
        if(!course_id){
            return res.json({
                success:false,
                message:'Please provide valid course id'
            });
        }
        //valid course id 
        let course;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.json({
                    success:false,
                    message:'Could not find the course'
                });
            }
            //user already pay for same course
            const uid = new mongoose.Types.ObjectId(userId);
            if(course.studentEnrolled.includes(uid)){
                return res.status(401).json({
                    success:false,
                    message:'Student is alredy enrolled',
                });
            }

        }
        catch(err){
            console.error(err);
            return res.status(500).json({
                success:false,
                message:err.message,
            });

        }
        //order create
        const amount = course.price;
        const currency = "INR";

        const options = {
            amount : amount*100,
            currency : currency,
            receipt : Math.random(Date.now()).toString(),
            notes:{
                courseId : course_id,
                userId,
            }
        };

        try{
            //initiate the payment using razorpay
            const paymentResponse = await instance.orders.create(options);
            console.log(paymentResponse);

            //return res
            return res.status(200).json({
                success:true,
                courseName: course.courseName,
                courseDesription : course.courseDescription,
                thumbmail : course.thumbnail,
                orderId:paymentResponse.id,
                currency:paymentResponse.currency,
                amount:paymentResponse.amount,
            });
        }catch(err){
            console.error(err);
            return res.json({
                success:false,
                message:'Could not initiate order',
            });
        }
        
    }catch(err){
        return res.status(500).json({
            success:false,
            message:'Could not initiate order.internal error',
        });
    }
}

//verify signature of razorpay and server

exports.verifySignature = async (req,res) => {
    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"];

    //steps to compare the webhooksecret came from razorpay
    const shasum = crypto.createHmac("sha256",webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest){
        console.log("Payment is Authorized");
        //we get userid and courseid from notes passed in capture payment handler
        //req.body.payload.payment.entity.notes
        const {courseId,userId} = req.body.payload.payment.entity.notes;

        try{
            //fulfill the action
            //find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id:courseId},
                {
                    $push:{
                        studentEnrolled:userId,
                    }
                },
                {new:true},
            );
            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:'Course not found'
                });
            }
            console.log(enrolledCourse);

            //find student and add the course to their list of enrolled course
            const enrolledStudent  = await User.findOneAndUpdate(
                {_id:userId},
                {
                    $push:{
                        courses:courseId
                    }
                },
                {new:true},
            );
            console.log(studentEnrolled);

            // mail send
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulation from EduStream",
                "Congratulation, you are onboarderd into new course"
            );

            return res.status(200).json({
                success:true,
                message:"Signature Verified and Course Added",
            });
        }catch(err){
            console.log(err);
            return res.status(500).json({
                success:false,
                message:err.message,
            });
        }
    }
    else{
        return res.status(400).json({
            success:false,
            message:'Invalid request'
        })
    }


}