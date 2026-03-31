const mongoose = require("mongoose");

const showTimeSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "movies",
        required: true,
    },
    theater: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Theater",
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["scheduled", "cancelled", "completed"],
        default: "scheduled",
    },
    bookedSeats: [
        {
            seatNumber: {
                type: String,
                required: true,
            },
            reservation: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "reservation",
            },
            bookedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("showTime", showTimeSchema);

