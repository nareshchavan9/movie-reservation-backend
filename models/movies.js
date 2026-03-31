const mongoose = require("mongoose");

const movies = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    poster_url: {
        type: String,
        required: true,
    },
    duration_min: {
        type: Number, // Bug fix: was String, should be Number
    },
    genre_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "genres"
    }
}, { timestamps: true });


module.exports = mongoose.model("movies", movies);
