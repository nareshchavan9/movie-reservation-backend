const mongoose = require("mongoose");
const ShowTime = require("../models/showtimes");
const Theater = require("../models/theaters");
const Movie = require("../models/movies");

const STATUS_OPTIONS = ["scheduled", "cancelled", "completed"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildDateRange = (dateString) => {
    const day = new Date(dateString);
    if (Number.isNaN(day.getTime())) {
        return null;
    }
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

exports.listShowtimes = async (req, res) => {
    try {
        const { date, movieId } = req.query;
        const filter = {};

        if (date) {
            const range = buildDateRange(date);
            if (!range) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date format. Use YYYY-MM-DD",
                });
            }
            filter.startTime = { $gte: range.start, $lte: range.end };
        }

        if (movieId) {
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid movieId",
                });
            }
            filter.movie = movieId;
        }

        const showtimes = await ShowTime.find(filter)
            .populate("movie", "title poster_url duration_min")
            .populate({
                path: "theater",
                select: "name total_rows total_cols",
            })
            .sort({ startTime: 1 });

        return res.status(200).json({
            success: true,
            count: showtimes.length,
            data: showtimes,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch showtimes",
        });
    }
};

exports.getShowtimeSeats = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid showtime id",
            });
        }

        const showtime = await ShowTime.findById(id)
            .populate("movie", "title poster_url duration_min")
            .populate({
                path: "theater",
                select: "name seats total_rows total_cols",
            });

        if (!showtime) {
            return res.status(404).json({
                success: false,
                message: "Showtime not found",
            });
        }

        const theaterSeats = Array.isArray(showtime.theater?.seats)
            ? showtime.theater.seats
            : [];
        const bookedSeatNumbers = new Set(
            (showtime.bookedSeats || []).map((seat) => seat.seatNumber)
        );

        const availableSeats = [];
        const bookedSeats = [];

        theaterSeats.forEach((seat) => {
            const seatPayload = {
                seat_number: seat.seat_number,
                type: seat.type,
                price: seat.price,
                row_label: seat.row_label,
                col_number: seat.col_number,
            };
            if (bookedSeatNumbers.has(seat.seat_number)) {
                bookedSeats.push(seatPayload);
            } else {
                availableSeats.push(seatPayload);
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                showtimeId: showtime._id,
                movie: showtime.movie,
                theater: showtime.theater,
                availableSeats,
                bookedSeats,
            },
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch seats for showtime",
        });
    }
};

exports.createShowtime = async (req, res) => {
    try {
        const { movieId, theaterId, startTime, endTime, status } = req.body;

        if (!movieId || !theaterId || !startTime) {
            return res.status(400).json({
                success: false,
                message: "movieId, theaterId and startTime are required",
            });
        }

        if (!isValidObjectId(movieId) || !isValidObjectId(theaterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid movieId or theaterId",
            });
        }

        const parsedStart = new Date(startTime);
        if (Number.isNaN(parsedStart.getTime())) {
            return res.status(400).json({
                success: false,
                message: "startTime must be a valid date",
            });
        }

        let parsedEnd;
        if (endTime) {
            parsedEnd = new Date(endTime);
            if (Number.isNaN(parsedEnd.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "endTime must be a valid date",
                });
            }
        }

        const [movieExists, theaterExists] = await Promise.all([
            Movie.findById(movieId),
            Theater.findById(theaterId),
        ]);

        if (!movieExists || !theaterExists) {
            return res.status(404).json({
                success: false,
                message: "Movie or theater not found",
            });
        }

        if (status && !STATUS_OPTIONS.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${STATUS_OPTIONS.join(", ")}`,
            });
        }

        const showtime = await ShowTime.create({
            movie: movieId,
            theater: theaterId,
            startTime: parsedStart,
            endTime: parsedEnd,
            status: status || "scheduled",
        });

        return res.status(201).json({
            success: true,
            message: "Showtime created successfully",
            data: showtime,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create showtime",
        });
    }
};

exports.updateShowtime = async (req, res) => {
    try {
        const { id } = req.params;
        const { movieId, theaterId, startTime, endTime, status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid showtime id",
            });
        }

        const updates = {};

        if (movieId) {
            if (!isValidObjectId(movieId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid movieId",
                });
            }
            const movieExists = await Movie.findById(movieId);
            if (!movieExists) {
                return res.status(404).json({
                    success: false,
                    message: "Movie not found",
                });
            }
            updates.movie = movieId;
        }

        if (theaterId) {
            if (!isValidObjectId(theaterId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid theaterId",
                });
            }
            const theaterExists = await Theater.findById(theaterId);
            if (!theaterExists) {
                return res.status(404).json({
                    success: false,
                    message: "Theater not found",
                });
            }
            updates.theater = theaterId;
        }

        if (startTime) {
            const parsedStart = new Date(startTime);
            if (Number.isNaN(parsedStart.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "startTime must be a valid date",
                });
            }
            updates.startTime = parsedStart;
        }

        if (endTime) {
            const parsedEnd = new Date(endTime);
            if (Number.isNaN(parsedEnd.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "endTime must be a valid date",
                });
            }
            updates.endTime = parsedEnd;
        }

        if (status) {
            if (!STATUS_OPTIONS.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `status must be one of: ${STATUS_OPTIONS.join(", ")}`,
                });
            }
            updates.status = status;
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({
                success: false,
                message: "No updates provided",
            });
        }

        const updatedShowtime = await ShowTime.findByIdAndUpdate(id, updates, {
            new: true,
        })
            .populate("movie", "title poster_url duration_min")
            .populate({
                path: "theater",
                select: "name total_rows total_cols",
            });

        if (!updatedShowtime) {
            return res.status(404).json({
                success: false,
                message: "Showtime not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Showtime updated successfully",
            data: updatedShowtime,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update showtime",
        });
    }
};

exports.deleteShowtime = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid showtime id",
            });
        }

        const deletedShowtime = await ShowTime.findByIdAndDelete(id);

        if (!deletedShowtime) {
            return res.status(404).json({
                success: false,
                message: "Showtime not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Showtime deleted successfully",
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete showtime",
        });
    }
};
