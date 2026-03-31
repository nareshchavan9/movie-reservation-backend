const Reservation = require("../models/reservations");
const ShowTime = require("../models/showtimes");

const normalizeDate = (value, endOfDay = false) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay) {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date;
};

exports.getRevenueReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const matchStage = { status: "confirmed" };

        if (from) {
            const fromDate = normalizeDate(from);
            if (!fromDate) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid 'from' date. Use YYYY-MM-DD",
                });
            }
            matchStage.createdAt = matchStage.createdAt || {};
            matchStage.createdAt.$gte = fromDate;
        }

        if (to) {
            const toDate = normalizeDate(to, true);
            if (!toDate) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid 'to' date. Use YYYY-MM-DD",
                });
            }
            matchStage.createdAt = matchStage.createdAt || {};
            matchStage.createdAt.$lte = toDate;
        }

        const breakdown = await Reservation.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$total_amount" },
                    reservations: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const totalRevenue = breakdown.reduce((sum, day) => sum + day.totalRevenue, 0);

        return res.status(200).json({
            success: true,
            data: {
                range: { from: from || null, to: to || null },
                totalRevenue,
                breakdown,
            },
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate revenue report",
        });
    }
};

exports.getOccupancyReport = async (req, res) => {
    try {
        const showtimes = await ShowTime.find()
            .populate("movie", "title")
            .populate({ path: "theater", select: "name seats" })
            .sort({ startTime: 1 });

        const rows = showtimes.map((showtime) => {
            const totalSeats = Array.isArray(showtime.theater?.seats)
                ? showtime.theater.seats.length
                : 0;
            const bookedSeats = Array.isArray(showtime.bookedSeats)
                ? showtime.bookedSeats.length
                : 0;
            const occupancy = totalSeats
                ? Number(((bookedSeats / totalSeats) * 100).toFixed(2))
                : 0;

            return {
                showtimeId: showtime._id,
                movie: showtime.movie?.title || "Unknown",
                theater: showtime.theater?.name || "Unknown",
                startTime: showtime.startTime,
                totalSeats,
                bookedSeats,
                occupancy,
            };
        });

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate occupancy report",
        });
    }
};

exports.getPopularMoviesReport = async (req, res) => {
    try {
        const report = await Reservation.aggregate([
            { $match: { status: "confirmed" } },
            {
                $lookup: {
                    from: "showtimes",
                    localField: "showTime",
                    foreignField: "_id",
                    as: "showtime",
                },
            },
            { $unwind: "$showtime" },
            {
                $group: {
                    _id: "$showtime.movie",
                    reservations: { $sum: 1 },
                    ticketsSold: {
                        $sum: {
                            $size: { $ifNull: ["$seats", []] },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "movies",
                    localField: "_id",
                    foreignField: "_id",
                    as: "movie",
                },
            },
            { $unwind: "$movie" },
            {
                $project: {
                    movieId: "$movie._id",
                    title: "$movie.title",
                    poster_url: "$movie.poster_url",
                    reservations: 1,
                    ticketsSold: 1,
                },
            },
            { $sort: { ticketsSold: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            count: report.length,
            data: report,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate popular movies report",
        });
    }
};
