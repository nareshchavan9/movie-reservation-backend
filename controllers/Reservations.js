const mongoose = require("mongoose");
const Reservation = require("../models/reservations");
const ShowTime = require("../models/showtimes");

const normalizeSeatNumbers = (seats) => {
    if (!Array.isArray(seats)) {
        return [];
    }
    return seats
        .map((seat) => {
            if (typeof seat === "string" || typeof seat === "number") {
                return String(seat).trim();
            }
            if (seat && typeof seat === "object") {
                const value =
                    seat.seatNumber || seat.seat_number || seat.number || "";
                return String(value).trim();
            }
            return "";
        })
        .map((seat) => seat.toUpperCase())
        .filter((seat) => Boolean(seat));
};

const populateReservation = () => ({
    path: "showTime",
    populate: [
        { path: "movie", select: "title poster_url duration_min" },
        { path: "theater", select: "name" },
    ],
});

exports.bookSeats = async (req, res) => {
    const { showtimeId, seats, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!showtimeId) {
        return res.status(400).json({
            success: false,
            message: "showtimeId is required",
        });
    }

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid showtimeId",
        });
    }

    const seatNumbers = normalizeSeatNumbers(seats);
    if (!seatNumbers.length) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one seat to book",
        });
    }

    const duplicates = seatNumbers.filter(
        (seat, index) => seatNumbers.indexOf(seat) !== index
    );
    if (duplicates.length) {
        return res.status(400).json({
            success: false,
            message: `Duplicate seats in request: ${[...new Set(duplicates)].join(", ")}`,
        });
    }

    if (process.env.RAZORPAY_KEY_SECRET) {
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Razorpay payment details required",
            });
        }

        const crypto = require("crypto");
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const showtime = await ShowTime.findById(showtimeId)
            .populate("theater")
            .session(session);

        if (!showtime) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Showtime not found",
            });
        }

        if (showtime.status === "cancelled") {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Cannot book seats for a cancelled showtime",
            });
        }

        const theaterSeats = Array.isArray(showtime.theater?.seats)
            ? showtime.theater.seats
            : [];
        const seatLookup = new Map(
            theaterSeats
                .filter((seat) => typeof seat.seat_number === "string")
                .map((seat) => [seat.seat_number.toUpperCase(), seat])
        );

        const missingSeats = seatNumbers.filter((seat) => !seatLookup.has(seat));
        if (missingSeats.length) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `These seats do not exist in the theater: ${missingSeats.join(", ")}`,
            });
        }

        const alreadyBooked = new Set(
            (showtime.bookedSeats || [])
                .map((seat) =>
                    typeof seat.seatNumber === "string"
                        ? seat.seatNumber.toUpperCase()
                        : null
                )
                .filter(Boolean)
        );
        const unavailableSeats = seatNumbers.filter((seat) => alreadyBooked.has(seat));
        if (unavailableSeats.length) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: `Seats already booked: ${unavailableSeats.join(", ")}`,
            });
        }

        const seatDetails = seatNumbers.map((seatNumber) => {
            const meta = seatLookup.get(seatNumber);
            return {
                seatNumber,
                type: meta.type,
                price: meta.price,
            };
        });

        const totalAmount = seatDetails.reduce((sum, seat) => sum + seat.price, 0);

        const [reservation] = await Reservation.create(
            [
                {
                    user: req.user.id,
                    showTime: showtimeId,
                    seats: seatDetails,
                    total_amount: totalAmount,
                },
            ],
            { session }
        );

        if (!Array.isArray(showtime.bookedSeats)) {
            showtime.bookedSeats = [];
        }

        showtime.bookedSeats.push(
            ...seatDetails.map((seat) => ({
                seatNumber: seat.seatNumber,
                reservation: reservation._id,
            }))
        );
        await showtime.save({ session });

        await session.commitTransaction();

        const populatedReservation = await Reservation.findById(reservation._id)
            .populate(populateReservation())
            .populate("user", "name email");

        return res.status(201).json({
            success: true,
            message: "Reservation created successfully",
            data: populatedReservation,
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Booking Error: ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create reservation",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user.id })
            .populate(populateReservation())
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reservations",
        });
    }
};

exports.cancelReservation = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid reservation id",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const reservation = await Reservation.findById(id).session(session);

        if (!reservation) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Reservation not found",
            });
        }

        const isOwner = reservation.user.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: "You are not allowed to cancel this reservation",
            });
        }

        if (reservation.status === "cancelled") {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Reservation already cancelled",
            });
        }

        const showtime = await ShowTime.findById(reservation.showTime).session(session);

        if (!showtime) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Associated showtime not found",
            });
        }

        if (showtime.startTime <= new Date()) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Only upcoming showtimes can be cancelled",
            });
        }

        const seatNumbers = reservation.seats
            .map((seat) =>
                typeof seat.seatNumber === "string"
                    ? seat.seatNumber.toUpperCase()
                    : null
            )
            .filter(Boolean);
        showtime.bookedSeats = (showtime.bookedSeats || []).filter(
            (seat) => !seatNumbers.includes(seat.seatNumber.toUpperCase())
        );
        await showtime.save({ session });

        reservation.status = "cancelled";
        reservation.cancelledAt = new Date();
        await reservation.save({ session });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Reservation cancelled successfully",
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Cancel Error: ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel reservation",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate(populateReservation())
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations,
        });
    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reservations",
            error: error.message
        });
    }
};
