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
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,              // Allow cookies
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

connectDB();

app.listen(PORT, () => {
    console.log(`server started at port ${PORT}`);
});