/**
 * seed.js – Populate the MovieReservation DB with mock data for testing
 *
 * Run:  node seed.js
 *
 * Note: Run this ONCE. A second run will skip items that already exist.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Genre = require("./models/genres");
const User = require("./models/users");
const Movie = require("./models/movies");
const Theater = require("./models/theaters");
const ShowTime = require("./models/showtimes");
const Reservation = require("./models/reservations");
const bcrypt = require("bcrypt");
const generateSeats = require("./utils/seatGenerator");

// ─── Free-to-use poster images (TMDB cover-style proxies) ───────────────────
const POSTERS = {
    "Interstellar": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
    "The Dark Knight": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&q=80",
    "Inception": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80",
    "Avatar": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80",
    "Avengers": "https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80",
    "Dune": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
};

async function seed() {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB");

    // ─── 1. Genres ────────────────────────────────────────────────────────────
    const genreNames = ["Sci-Fi", "Action", "Thriller", "Drama", "Adventure"];
    const genreMap = {};
    for (const name of genreNames) {
        let g = await Genre.findOne({ name });
        if (!g) g = await Genre.create({ name });
        genreMap[name] = g._id;
        console.log(`  Genre: ${name}`);
    }

    // ─── 2. Users ─────────────────────────────────────────────────────────────
    const usersData = [
        { name: "Admin User", email: "admin@cinebook.com", password: "admin123", role: "admin" },
        { name: "Alice Smith", email: "alice@cinebook.com", password: "user123", role: "user" },
        { name: "Bob Jones", email: "bob@cinebook.com", password: "user123", role: "user" },
    ];
    const userMap = {};
    for (const u of usersData) {
        let user = await User.findOne({ email: u.email });
        if (!user) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            user = await User.create({ name: u.name, email: u.email, password: hashedPassword, role: u.role });
        }
        userMap[u.email] = user._id;
        console.log(`  User: ${u.email} / ${u.password} [${u.role}]`);
    }

    // ─── 3. Movies ────────────────────────────────────────────────────────────
    const moviesData = [
        {
            title: "Interstellar",
            desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            duration_min: 169,
            genre_id: genreMap["Sci-Fi"],
            poster_url: POSTERS["Interstellar"],
        },
        {
            title: "The Dark Knight",
            desc: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            duration_min: 152,
            genre_id: genreMap["Action"],
            poster_url: POSTERS["The Dark Knight"],
        },
        {
            title: "Inception",
            desc: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            duration_min: 148,
            genre_id: genreMap["Thriller"],
            poster_url: POSTERS["Inception"],
        },
        {
            title: "Avatar",
            desc: "A paraplegic marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
            duration_min: 162,
            genre_id: genreMap["Adventure"],
            poster_url: POSTERS["Avatar"],
        },
        {
            title: "Avengers: Endgame",
            desc: "After the devastating events of Infinity War, the universe is in ruins. The Avengers assemble once more to reverse Thanos's actions and restore balance.",
            duration_min: 181,
            genre_id: genreMap["Action"],
            poster_url: POSTERS["Avengers"],
        },
        {
            title: "Dune",
            desc: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.",
            duration_min: 155,
            genre_id: genreMap["Sci-Fi"],
            poster_url: POSTERS["Dune"],
        },
    ];
    const movieMap = {};
    for (const m of moviesData) {
        let movie = await Movie.findOne({ title: m.title });
        if (!movie) movie = await Movie.create(m);
        movieMap[m.title] = movie._id;
        console.log(`  Movie: ${m.title}`);
    }

    // ─── 4. Theaters ──────────────────────────────────────────────────────────
    const theatersData = [
        { name: "IMAX Hall 1", total_rows: 10, total_cols: 15 },
        { name: "Gold Class", total_rows: 6, total_cols: 8 },
        { name: "Standard Hall", total_rows: 12, total_cols: 20 },
    ];
    const theaterMap = {};
    for (const t of theatersData) {
        let theater = await Theater.findOne({ name: t.name });
        if (!theater) {
            const seats = generateSeats(t.total_rows, t.total_cols);
            theater = await Theater.create({ ...t, seats });
        }
        theaterMap[t.name] = theater._id;
        console.log(`  Theater: ${t.name} (${t.total_rows}×${t.total_cols} = ${t.total_rows * t.total_cols} seats)`);
    }

    // ─── 5. Showtimes ─────────────────────────────────────────────────────────
    // Mix of upcoming + recently past
    const now = new Date();
    const day = (d, h = 0) => {
        const dt = new Date(now);
        dt.setDate(dt.getDate() + d);
        dt.setHours(h, 0, 0, 0);
        return dt;
    };

    const showtimesData = [
        { movie: "Interstellar", theater: "IMAX Hall 1", startTime: day(0, 14), endTime: day(0, 17) },
        { movie: "Interstellar", theater: "Standard Hall", startTime: day(1, 18), endTime: day(1, 21) },
        { movie: "The Dark Knight", theater: "IMAX Hall 1", startTime: day(0, 18), endTime: day(0, 21) },
        { movie: "The Dark Knight", theater: "Gold Class", startTime: day(2, 16), endTime: day(2, 19) },
        { movie: "Inception", theater: "Standard Hall", startTime: day(1, 12), endTime: day(1, 15) },
        { movie: "Inception", theater: "IMAX Hall 1", startTime: day(3, 20), endTime: day(3, 23) },
        { movie: "Avatar", theater: "Gold Class", startTime: day(0, 20), endTime: day(0, 23) },
        { movie: "Avatar", theater: "Standard Hall", startTime: day(2, 14), endTime: day(2, 17) },
        { movie: "Avengers: Endgame", theater: "IMAX Hall 1", startTime: day(1, 15), endTime: day(1, 18) },
        { movie: "Dune", theater: "Standard Hall", startTime: day(4, 17), endTime: day(4, 20) },
        // Past showtime (for completed status display)
        { movie: "Inception", theater: "Gold Class", startTime: day(-2, 14), endTime: day(-2, 17), status: "completed" },
        { movie: "The Dark Knight", theater: "Standard Hall", startTime: day(-1, 18), endTime: day(-1, 21), status: "completed" },
    ];

    const showtimeIds = [];
    for (const st of showtimesData) {
        const existing = await ShowTime.findOne({
            movie: movieMap[st.movie],
            theater: theaterMap[st.theater],
            startTime: st.startTime,
        });
        if (!existing) {
            const doc = await ShowTime.create({
                movie: movieMap[st.movie],
                theater: theaterMap[st.theater],
                startTime: st.startTime,
                endTime: st.endTime,
                status: st.status || "scheduled",
            });
            showtimeIds.push(doc._id);
            console.log(`  Showtime: ${st.movie} @ ${st.theater} – ${st.startTime.toLocaleString()}`);
        }
    }

    // ─── 6. Sample Reservations ───────────────────────────────────────────────
    // Only create reservations for upcoming-shows first showtime found
    const upcomingShowtimes = await ShowTime.find({ status: "scheduled" })
        .populate("theater")
        .limit(4);

    for (let i = 0; i < Math.min(upcomingShowtimes.length, 2); i++) {
        const st = upcomingShowtimes[i];
        const userId = i === 0 ? userMap["alice@cinebook.com"] : userMap["bob@cinebook.com"];

        // Pick first 2 available seats
        const theaterSeats = st.theater?.seats || [];
        if (theaterSeats.length < 2) continue;

        const seatsToBook = theaterSeats.slice(0, 2);
        const seatDetails = seatsToBook.map(s => ({
            seatNumber: s.seat_number,
            type: s.type,
            price: s.price,
        }));
        const totalAmount = seatDetails.reduce((sum, s) => sum + s.price, 0);

        const alreadyBooked = await Reservation.findOne({ showTime: st._id, user: userId });
        if (alreadyBooked) continue;

        const reservation = await Reservation.create({
            user: userId,
            showTime: st._id,
            seats: seatDetails,
            total_amount: totalAmount,
            status: "confirmed",
        });

        // Mark seats as booked in the showtime
        st.bookedSeats.push(...seatDetails.map(s => ({
            seatNumber: s.seatNumber,
            reservation: reservation._id,
        })));
        await st.save();

        console.log(`  Reservation: ${seatsToBook.map(s => s.seat_number).join(", ")} booked by user ${i + 1}`);
    }

    console.log("\n🎬 Seed complete! Test credentials:");
    console.log("  Admin → admin@cinebook.com / admin123");
    console.log("  User  → alice@cinebook.com / user123");
    console.log("  User  → bob@cinebook.com   / user123\n");

    await mongoose.disconnect();
}

seed().catch(err => {
    console.error("Seed failed:", err);
    mongoose.disconnect();
    process.exit(1);
});
