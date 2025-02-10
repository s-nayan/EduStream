const mongoose = require('mongoose');
const courseProgess = new mongoose.Schema({
    
    courseID: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Courses",
    },
    completedVideo: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"SubSection",
        }
    ]
});

module.exports = mongoose.model("CourseProgess",courseProgess);

