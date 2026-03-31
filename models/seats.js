const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
    seat_number: {
        type: String,
        required: true,
    },
    row_label: {
        type: String,
        required: true,
    },
    col_number: {
        type: Number,
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
}, { _id: true });

module.exports = mongoose.model("seats", seatSchema);

