const Category = require("../models/Category");

//create tag handler

exports.createCategory= async (req,res) => {
    try{
        //fetch data
        const {name, description} = req.body;

        //validation
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }
        //create entry in db
        const tagDetails = await Category.create({
            name:name,
            description:description,
        });
        console.log(tagDetails);

        //return res
        return res.status(200).json({
            success:true,
            message:'Tag created successfully',
        });
    }catch(err){
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
};



//get All tags handler

exports.showAllCategory = async (req,res) => {
    try{

        const allCategory = await Category.find({},{name:true,description:true});
 
        return res.status(200).json({
            success:true,
            message:'All Category returned successfully',
            allCategory,
        });
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }

};

//categoryPageDetails
exports.categoryPageDetails = async (req,res) => {
    try{

        //get categoryId
        const {categoryId} = req.body;
        //get coursss for specified categoryid
        const selectedCategory = await Category.findById(categoryId).populate({
            path: "courses",
            match: { status: "Published" },
            populate: "ratingAndReviews",
          }).exec();
        //validation
        if(!selectedCategory){
            return res.status(404).json({
                success:false,
                message:"Data Not Found",
            });
        }
        //get courses from different category
        const differentCategories = await Category.findById({
            _id:{$ne:categoryId},
        }).populate({
            path: "courses",
            match: { status: "Published" },
          }).exec();
        //get top selling courses
        const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()
        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
        //return res
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategories,
                mostSellingCourses
            },
        });

    }catch(err){
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}