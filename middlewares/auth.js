const jwt = require("jsonwebtoken");
require("dotenv").config();


exports.auth = async (req, res, next) => {
    try {
        const token =
            (req.cookies && req.cookies.token) ||
            (req.header("Authorization")?.replace("Bearer ", ""));

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is missing'
            })
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;

        } catch (error) {
            console.log("Error : ", error);
            // Bug fix: invalid/expired token should be 401 Unauthorized, not 500
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired'
            })
        }
        next();
    }
    catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while validating token'
        })
    }
}

exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: admin role required'
            })
        }
        next();
    } catch (error) {
        console.log("error : ", error);
        return res.status(500).json({
            success: false,
            message: 'Error checking admin role'
        })
    }
};



exports.isUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: user role required'
            })
        }
        next();
    } catch (error) {
        console.log("error : ", error);
        return res.status(500).json({
            success: false,
            message: 'Error checking user role'
        })
    }
};