const mongoose = require("mongoose");

// ✅ Step 1: Define seatSchema FIRST
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
        enum: ['regular', 'premium', 'vip'],
        default: 'regular',
    },
    price: {
        type: Number,
        required: true,
    }
}, { _id: true });

// ✅ Step 2: Use seatSchema inside theaterSchema
const theaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    total_rows: {
        type: Number,
        required: true,
    },
    total_cols: {
        type: Number,
        required: true,
    },
    seats: [seatSchema],     // ✅ seatSchema is now defined above
}, { timestamps: true });

module.exports = mongoose.model("Theater", theaterSchema);
