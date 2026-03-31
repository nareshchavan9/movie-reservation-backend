const express = require("express");
const routes = express.Router();

const {signup,login,getUserDetails} = require("../controllers/auth");
const {auth,isAdmin,isUser} = require("../middlewares/auth");
const {createGenre,getAllGenre} = require("../controllers/Genres");

routes.post("/signup",signup);
routes.post("/login",login);
routes.get("/me",auth,getUserDetails);

routes.post("/createGenre",auth,isAdmin,createGenre);
routes.get("/getAllGenre",auth,isAdmin,getAllGenre);

module.exports = routes;