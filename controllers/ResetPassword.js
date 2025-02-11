const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require('bcrypt');

//resetPasswordToken
exports.resetPasswordToken = async (req,res) => {
    try{
        //get email from req body
        const email = req.body.email;
        //check user for this email, email validation
        const user = await User.findOne({email:email});

        if(!user){
            return res.status(401).json({
                success:false,
                message:"This Email is not registered"
            });
        }

        //generate token
        const token = crypto.randomUUID();
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate({email:email},{
            token:token,
            resetPasswordExpires: Date.now() + 5*60*1000,
        },{new:true});
        //create url
        const url = `http://localhost:3000/update-password/${token}`;

        //send email containing mail
        await mailSender(email, "Password Reset Link",`Password Reset Link : ${url}`)
        //return response
        return res.status(200).json({
            success:true,
            message:"Email Sent Successfully"
        });



        
    }catch(err){
        console.log("Error in resetpwd.js",err);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while reseting the password"
        });
    }
    
}

//resetPassword
exports.resetPassword = async (req,res) => {
    try{
        //data fetch
        const {password,confirmPassword, token}  = req.body;
        //validation
        if(password !== confirmPassword){
            return res.status(401).json({
                success:false,
                message:"Password Mismatched"
            });
        }
        //get user detail
        const userDetails = await user.findOne({token:token});
        //if no entry --> invalid token
        if(!userDetails){
            return res.status(401).json({
                success:false,
                message:"Token is Invalid"
            });
        }
        //token time
        if(userDetails.resetPasswordExpires <   Date.now()){
            return res.status(401).json({
                success:false,
                message:"Link Expired,Please    regenerate token"
            });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password,10);

        //update password
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        );
        //return res
        return res.status(200).json({
            success:true,
            message:"Password Reseted"
        });
    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Error in Resting Password"
        });
    }
    
    
}