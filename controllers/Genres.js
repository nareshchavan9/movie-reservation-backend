const genre = require("../models/genres");

exports.createGenre = async (req, res) => {
    try {

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Genre name is required"
            })
        };

        const exist = await genre.findOne({ name });

        if (exist) {

            return res.status(400).json({
                success: false,
                message: 'Genre already exists'
            })
            
        }

        const result = await genre.create({ name: name });

        return res.status(200).json({
            success: true,
            message: 'Genre added',
            result,
        })

    } catch (error) {

        console.log("Error : ", error);

        return res.status(500).json({
            success: false,
            message: 'Error while creating genre',
        })
    }
};


exports.getAllGenre = async (req, res) => {
    try {

        const getAll = await genre.find({});

        if (!getAll) {
            return res.status(400).json({
                success: false,
                message: 'No Genre Found'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Found',
            getAll,
        })
    }
    catch (error) {

        console.log("Error : ", error);

        return res.status(500).json({
            success: false,
            message: 'something went wrong while fetching genres'
        })
    }
};