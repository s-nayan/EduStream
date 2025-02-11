const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    firstName: {
        type:String,
        required:true,
        trim:true,
    },
    lastName: {
        type:String,
        required:true,
        trim:true,
    },
    email: {
        type:String,
        required:true,
        trim:true,
    },
    password: {
        type:String,
        required:true,
    },
    accountType: {
        type:String,
        enum:["Admin", "Student", "Instructor"],
        required:true,
    },
    additionalDetails: {
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Profile",
    },
    courses: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Courses",
        }
    ],
    image: {
        type:String,  //to store image Id
        required:true,
    },
    courseProgess: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"CourseProgress",
        }
    ],
    token:{
        type:String,
    },
    resetPasswordExpires: {
        type:Date,
    }
});

module.exports = mongoose.model("User",userSchema);