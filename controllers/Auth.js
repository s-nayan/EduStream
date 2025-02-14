const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require("../models/Profile");
const jwt = require('jsonwebtoken');
require("dotenv").config();

//send OTP
exports.sendOTP = async (req,res) =>{
    try{
        //fetch email from request body
        const {email} = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({email});

        //if user already exist, then return a response
        if(checkUserPresent) {
            return res.status(401).json({
                success:false,
                message:'Email already registered',
            })
        }

        //generate otp
        var otp = otpGenerator.generate(6/*len of otp */,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated",otp);

        //check unique otp or not
        const result = await OTP.findOne({otp:otp});

        //generally nt make loop fr db check
        while(result){
            otp = otpGenerator.generate(6/*len of otp */,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp:otp});
        }

        //creating otp obj
        const otpPayload = {email,otp};
        //create entry in db for otp
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP BODY: ",otpBody);

        //return success response
        res.status(200).json({
            success:true,
            message:'OTP sent Successfully',
            otp,
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Error while generating OTP',
        })
    }
    
}

//singnUp
exports.signUp = async (req,res) => {
    try{

        //data fetch
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp   
        } = req.body;

        //validating
        if(!firstName || !lastName || !email || !password ||!confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            });
        }

        //2 password match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Passwords does not match. Please try again!"
            });
        }

        //check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({
                success:false,
                message:"User Already Registered"
            });
        }

        //find most recent OTP stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
        //validate OTP
        if(recentOtp.length == 0){
            //OTP not found
            return res.status(400).json({
                success:false,
                message:"OTP not found"
            });
        }else if(otp != recentOtp[0].otp) {
            //Invalid OTP
            return res.status(400).json({
                success:false,
                message:"Invalid OTP!"
            });
        }

        //Hash Password
        const hashedPassword = await bcrypt.hash(password,10);

        //entry created in db

        const ProfileDeatil = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password:hashedPassword,
            accountType,
            contactNumber,
            additionalDetails:ProfileDeatil._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return res
        return res.status(200).json({
            success:true,
            message:"User is registered Successfully",
            user,
        });

    }catch(err){
        console.log("Error in Auth.js/signUp",err);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Please try again"
        });
    }
}

//login
exports.login = async (req,res) => {
    try{
        //get data req body
        const {email,password} = req.body;

        //validate data
        if(!email || !password){
            return res.status(403).json({
                success:false,
                message:"All fields are required,Please try again!"
            });
        }

       //user check exist or not
        const user = await User.findOne({email}).populate("additionalDeatils");
        
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User not registered, Please Sign Up "
            });
        }
        //password match and generate JWT
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"3h",
            });
            user.token = token;
            user.password = undefined;
        
            //create cookie and send response
            const options = {
                expires: new Date(Date.now() +  3*24*60*60 *1000),
                httpOnly:true,
            }
            res.cookie("token",token,options).  status(200).json({
                success:true,
                token,
                user,
                message:'Logged in Successfully',
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:"Password is incorrect"
            });
        }

    }catch(err){
        console.log("Error in Auth.js/login",err);
        return res.status(500).json({
            success:false,
            message:"Login failur.Please try again"
        });
    }
}

//changePassword
exports.changePassword = async (req,res) => {
    try{
    //get data frm req body
    //get oldPassword,newPassword,confirmPassword
    const {email,oldPassword,newPassword,confirmPassword} = req.body;
    //validation
    if(newPassword !== confirmPassword){
        return res.status(403).json({
            success:false,
            message:"Password does not match"
        });
    }
    const user = await user.findOne({email});
    if(!user){
        return res.status(403).json({
            success:false,
            message:"Incorrect Email"
        });
    }
    const hashedPassword = await bcrypt.hash(newPassword,10);
    //update pwd in DB
    if(await bcrypt.compare(oldPassword, user.password)){
        const updatedDetails = await User.findOneAndUpdate(
            {email:email},
            {passwword:hashedPassword},
            {new:true},
        )
    }else{
        return res.status(403).json({
            success:false,
            message:"Old Password does not match"
        });
    }
    //sendmail -- Password updated
    await mailSender(email, "Password Updated Alert",`Password Updated`)
    //return res
    return res.status(200).json({
        success:true,
        message:"Password Updated"
    });
    }catch(err){
        console.log("Error in auth.js/changepwd",err);
        return res.status(500).json({
            success:false,
            message:"Error in changing password"
        });
    }
}

