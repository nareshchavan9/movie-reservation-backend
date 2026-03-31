const mongoose = require("mongoose");

const genres = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    }
}, { timestamps: true });


module.exports = mongoose.model("genres",genres);