const express = require("express");
const router = express.Router();
const {auth, isInstructor, isStudent} = require("../middlewares/auth");
const { updateProfile,deleteAccount,getAllUserDetails } = require("../controllers/Profile");

router.delete("/deleteAccount",auth,deleteAccount);
router.put("/updateProfile",auth,updateProfile);
router.get("/getAllUserDetails",auth,getAllUserDetails);



module.exports = router;