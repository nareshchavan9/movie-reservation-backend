const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    showTime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "showTime",
        required: true,
    },
    seats: [
        {
            seatNumber: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ["regular", "premium", "vip"],
                default: "regular",
            },
            price: {
                type: Number,
                required: true,
            },
        },
    ],
    total_amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed",
    },
    cancelledAt: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model("reservation", reservationSchema);

