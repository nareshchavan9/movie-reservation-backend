const User = require("../models/users");

exports.getAllUsers = async(req,res)=>{
    try{

        const allUsers = await User.find({});
        if(!allUsers){
            return res.status(400).json({
                success : false,
                message : 'no users found'
            })
        }

        return res.status(200).json({
            success: true,
            message : 'All Users Found',
            allUsers,
        })

    }catch(error){
        console.log("Error : ",error);
        return res.status(500).json({
            success : false,
            message : 'Error while fetching all user details'
        })

    }
}