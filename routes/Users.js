const express = require("express");
const routes = express.Router();

const {getAllUsers} = require("../controllers/Users");
const {auth,isAdmin,isUser} = require("../middlewares/auth");


routes.get("/getAllUsers",auth,isAdmin,getAllUsers);

module.exports = routes;

