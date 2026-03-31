const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const routes = express.Router();

const { createMovie, getMovieById, getMovies, deleteMovie, updateMovie } = require("../controllers/Movies");
const { auth, isAdmin } = require("../middlewares/auth");

const uploadsDir = path.join(__dirname, "../tmp/uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_, __, cb) => cb(null, uploadsDir),
	filename: (_, file, cb) => {
		const ext = path.extname(file.originalname || "");
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `poster-${uniqueSuffix}${ext}`);
	},
});

const upload = multer({ storage });
const uploadAny = upload.any();
const allowedPosterFields = ["poster", "poster_url", "posterImage", "image"];

const posterUpload = (req, res, next) => {
	uploadAny(req, res, (err) => {
		if (err) {
			return next(err);
		}
		if (!req.file && Array.isArray(req.files)) {
			const match = req.files.find((file) => allowedPosterFields.includes(file.fieldname));
			if (match) {
				req.file = match;
			}
		}
		next();
	});
};

routes.post("/create", auth, isAdmin, posterUpload, createMovie);
routes.get("/getMovies", getMovies);                           // Public - no auth needed for browsing
routes.get("/getMovie/:id", getMovieById);                     // Public
routes.put("/update/:id", auth, isAdmin, updateMovie);         // Bug fix: added /:id param
routes.delete("/delete/:id", auth, isAdmin, deleteMovie);      // Bug fix: added /:id param


module.exports = routes;
