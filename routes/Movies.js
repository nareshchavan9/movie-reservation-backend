const express = require("express");
const multer = require("multer");
const routes = express.Router();

const { createMovie, getMovieById, getMovies, deleteMovie, updateMovie } = require("../controllers/Movies");
const { auth, isAdmin } = require("../middlewares/auth");

// Use memory storage for Vercel compatibility
// Files are processed in memory and uploaded directly to Cloudinary
const storage = multer.memoryStorage();

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
