const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:5*60,
    }
});

//funtion to send mail
async function sendVerificationEmail(email,otp) {
    try{
        const mailResponse = await mailSender(email,"Verification Email from EduStream", otp);
        console.log("Email sent Successfully",mailResponse);

    }catch(error){
        console.log("Error in sending mails", error);
        throw error;
    }
}
//sending mail
OTPSchema.pre("save", async function name(next) {
    await sendVerificationEmail(this.email,this.otp);
    next();
});


module.exports = mongoose.model("OTP", OTPSchema);