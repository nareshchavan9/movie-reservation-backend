const fs = require("fs");
const mongoose = require("mongoose");
const Movie = require("../models/movies"); // removed duplicate require
const Genre = require("../models/genres");
const cloudinary = require("../utils/cloudinary");

exports.getMovies = async (req, res) => {
    try {

        const { search } = req.query;

        let query = {};

        // Bug fix: `genre` field doesn't exist on the movie schema.
        // Movie has genre_id (ObjectId ref), so search by title only.
        if (search) {
            query = {
                title: { $regex: search, $options: "i" }
            };
        }

        const movies = await Movie.find(query).populate("genre_id", "name");

        res.status(200).json({
            success: true,
            data: movies
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMovieById = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Movie Id Is Required'
            })
        }

        const movie = await Movie.findById(id).populate("genre_id", "name");

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie Not Found'
            })

        }

        return res.status(200).json({
            success: true,
            message: 'Movie Found',
            movie,
        })
    }
    catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while fetching your movie'
        })
    }

};

exports.createMovie = async (req, res) => {
    try {
        const { title, desc, duration_min, genre_id } = req.body || {};
        const file = req.files && req.files[0]; // multer upload

        // 1. Validate required fields
        if (!title || !desc || !duration_min || !genre_id || !file) {
            console.log("missing fields : ", title, desc, duration_min, genre_id, file);
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // 2. Validate genre_id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(genre_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid genre_id'
            });
        }

        // 3. Check genre actually exists
        const genreExists = await Genre.findById(genre_id);
        if (!genreExists) {
            return res.status(404).json({
                success: false,
                message: 'Genre not found'
            });
        }

        // 4. Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: "movie_posters",
        });

        // 5. Delete temp file after upload
        fs.unlink(file.path, (err) => {
            if (err) console.log('Temp file cleanup failed:', err);
        });

        // 6. Create movie
        const newMovie = await Movie.create({
            title,
            desc,
            poster_url: result.secure_url,
            duration_min: Number(duration_min),
            genre_id
        });

        return res.status(201).json({
            success: true,
            message: 'Movie created successfully',
            data: newMovie
        });

    } catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while creating movie'
        })
    }
};



exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params; // Bug fix: route now has /:id
        const { title, desc, duration_min, genre_id } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Movie Id is missing'
            })
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (desc) updateData.desc = desc;
        if (duration_min) updateData.duration_min = Number(duration_min);
        if (genre_id) updateData.genre_id = genre_id;

        const updatedMovie = await Movie.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedMovie) {
            return res.status(404).json({
                success: false,
                message: 'Movie Not Found'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Movie Updated Successfully',
            updatedMovie,
        })

    }
    catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while updating movie'
        })
    }
};


exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params; // Bug fix: route now has /:id

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Movie Id is missing'
            })
        }

        const deletedMovie = await Movie.findByIdAndDelete(id);

        if (!deletedMovie) {
            return res.status(404).json({
                success: false,
                message: 'Movie Not Found'
            })
        }

        // Bug fix: removed reference to undefined `updatedMovie`
        return res.status(200).json({
            success: true,
            message: 'Movie deleted successfully',
        })

    }
    catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while deleting movie'
        })
    }
};



