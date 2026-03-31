const express = require("express");
const router = express.Router();

const {
    bookSeats,
    getMyReservations,
    cancelReservation,
    getAllReservations,
} = require("../controllers/Reservations");
const { createRazorpayOrder } = require("../controllers/payment");
const { auth, isAdmin } = require("../middlewares/auth");

router.post("/reservations", auth, bookSeats);
router.post("/create-razorpay-order", auth, createRazorpayOrder);
router.get("/reservations/my", auth, getMyReservations);
router.delete("/reservations/:id", auth, cancelReservation);
router.get("/reservations", auth, isAdmin, getAllReservations);

module.exports = router;
