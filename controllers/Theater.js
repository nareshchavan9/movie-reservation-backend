const Theater = require("../models/theaters");
const generateSeats = require("../utils/seatGenerator");


exports.createTheater = async (req, res, next) => {
    try {
        const { name, total_rows, total_cols } = req.body;

        if (!name || !total_rows || !total_cols) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Auto-generate seats
        const seats = generateSeats(Number(total_rows), Number(total_cols));

        const theater = await Theater.create({
            name,
            total_rows: Number(total_rows),
            total_cols: Number(total_cols),
            seats,
        });

        return res.status(201).json({
            success: true,
            message: 'Theater created successfully',
            data: theater
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find({}, 'name total_rows total_cols createdAt');
        return res.status(200).json({
            success: true,
            count: theaters.length,
            data: theaters,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch theaters',
        });
    }
};

exports.deleteTheater = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Theater.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Theater not found' });
        }
        return res.status(200).json({ success: true, message: 'Theater deleted successfully' });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({ success: false, message: 'Failed to delete theater' });
    }
};