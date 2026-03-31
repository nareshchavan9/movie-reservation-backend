const express = require("express");
const router = express.Router();

const {
    listShowtimes,
    getShowtimeSeats,
    createShowtime,
    updateShowtime,
    deleteShowtime,
} = require("../controllers/Showtimes");
const { auth, isAdmin } = require("../middlewares/auth");

router.get("/showtimes", auth, listShowtimes);
router.get("/showtimes/:id/seats", auth, getShowtimeSeats);
router.post("/showtimes", auth, isAdmin, createShowtime);
router.put("/showtimes/:id", auth, isAdmin, updateShowtime);
router.delete("/showtimes/:id", auth, isAdmin, deleteShowtime);

module.exports = router;
