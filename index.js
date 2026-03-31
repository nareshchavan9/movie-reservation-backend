require("dotenv").config(); // Must be first so env vars are available for all modules

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

const { connectDB } = require("./config/db");

const auth = require("./routes/auth");
const users = require("./routes/Users");
const movie = require("./routes/Movies");
const showtimes = require("./routes/Showtimes");
const theater = require("./routes/Theater");
const reservations = require("./routes/Reservations");
const reports = require("./routes/Reports");

app.use(cors({
    origin: process.env.FRONTEND_URL || "https://movie-reservation-frontend-peach.vercel.app/",
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); // Required so req.cookies is populated

app.use("/api/v1", auth);
app.use("/api/v1", users);
app.use("/api/v1", movie);
app.use("/api/v1", showtimes);
app.use("/api/v1", theater);
app.use("/api/v1", reservations);
app.use("/api/v1", reports);

// Initialize database connection
connectDB().catch((error) => {
    console.error("Failed to connect to database:", error);
    // App still runs even if DB connection fails initially
    // Mongoose will retry connection from connection pool
});

// For local development only
if (process.env.NODE_ENV !== "production") {
    const server = app.listen(PORT, () => {
        console.log(`server started at port ${PORT}`);
    });
}

// Export app for Vercel serverless
module.exports = app;