const bcrypt = require("bcrypt");
const User = require('../models/users');
const jwt = require("jsonwebtoken");
require('dotenv').config();


exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'all fields are required'
            });
        }

        const userExist = await User.findOne({ email: email });
        if (userExist) {
            return res.status(400).json({
                success: false,
                message: 'user already exist',
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await User.create({ email: email, name: name, password: hashedPassword, role: role });

        return res.status(201).json({
            success: true,
            message: 'user registered successfully',
            result,
        })
    }
    catch (error) {
        console.log("Error While Signup : ", error);
        return res.status(500).json({
            success: false,
            message: 'unable to register',
        })
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All Fields Are Required',
            })
        }

        // Bug fix: check if user actually exists before calling bcrypt
        const userExist = await User.findOne({ email }).select("+password");
        if (!userExist) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            })
        }

        const isMatch = await bcrypt.compare(password, userExist.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            })
        }

        const payload = {
            id: userExist._id,
            email: userExist.email,
            role: userExist.role,
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        };

        return res.cookie('token', token, options).status(200).json({
            success: true,
            message: 'Login Successful',
            token,
            user: {
                id: userExist._id,
                name: userExist.name,
                email: userExist.email,
                role: userExist.role,
            }
        })


    }

    catch (error) {
        console.log("Error While Login : ", error);
        return res.status(500).json({
            success: false,
            message: 'Unable to login'
        })
    }
};


exports.getUserDetails = async (req, res) => {
    try {

        const email = req.user.email;

        const details = await User.findOne({ email: email });

        if (!details) {
            // Bug fix: removed reference to `error` which was undefined in this scope
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'User found',
            details,
        })

    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'Error while fetching user details'
        })
    }

}