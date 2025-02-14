const express = require("express");
const router = express.Router();

const {login,sendOTP,signUp,changePassword} = require("../controllers/Auth");
const {auth} = require("../middlewares/auth");
const {resetPassword,resetPasswordToken} = require("../controllers/ResetPassword");

router.post("/login",login);
router.post("/sendOTP",sendOTP);
router.post("/signUp",signUp);
router.post("/changePassword",auth,changePassword);

router.post("/resetPassword",resetPassword
);
router.post("/resetPasswordToken",resetPasswordToken);

module.exports = router;
