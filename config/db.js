const mongoose = require("mongoose");

require("dotenv").config();

exports.connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("db connected successfully");
        return true;
    } catch (error) {
        console.error("Error While Connecting With Database:", error);
        throw error;
    }
};