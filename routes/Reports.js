const express = require("express");
const router = express.Router();

const {
    getRevenueReport,
    getOccupancyReport,
    getPopularMoviesReport,
} = require("../controllers/Reports");
const { auth, isAdmin } = require("../middlewares/auth");

router.get("/reports/revenue", auth, isAdmin, getRevenueReport);
router.get("/reports/occupancy", auth, isAdmin, getOccupancyReport);
router.get("/reports/popular-movies", auth, isAdmin, getPopularMoviesReport);

module.exports = router;
