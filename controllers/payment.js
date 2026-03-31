const Razorpay = require('razorpay');
const ShowTime = require('../models/showtimes');

exports.createRazorpayOrder = async (req, res) => {
    try {
        const { showtimeId, seats } = req.body;

        if (!showtimeId || !seats || !seats.length) {
            return res.status(400).json({ success: false, message: "Missing showtimeId or seats" });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ success: false, message: "Razorpay keys are not configured in backend .env" });
        }

        const showtime = await ShowTime.findById(showtimeId).populate("movie", "title").populate("theater");
        if (!showtime) {
            return res.status(404).json({ success: false, message: "Showtime not found" });
        }

        const theaterSeats = Array.isArray(showtime.theater?.seats) ? showtime.theater.seats : [];
        const seatLookup = new Map(
            theaterSeats
                .filter((seat) => typeof seat.seat_number === "string")
                .map((seat) => [seat.seat_number.toUpperCase(), seat])
        );

        let totalAmount = 0;
        for (const seatNumber of seats) {
            const upSeat = String(seatNumber).toUpperCase();
            const meta = seatLookup.get(upSeat);
            if (!meta) {
                return res.status(400).json({ success: false, message: `Seat ${upSeat} not found in theater` });
            }
            totalAmount += Math.round(meta.price);
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Amount in paise
        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `rcpt_${showtimeId.slice(-6)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Send back everything needed by frontend Razorpay initialization
        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID, // Safe to expose public key
            movieTitle: showtime.movie?.title || 'Movie Ticket'
        });
    } catch (error) {
        console.error("Razorpay Error: ", error);
        res.status(500).json({ success: false, message: "Could not create Razorpay order", error: error.message || error.description || JSON.stringify(error) });
    }
};
