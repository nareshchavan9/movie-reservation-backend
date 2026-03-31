const express = require("express");
const routes = express.Router();

const { createTheater, getAllTheaters, deleteTheater } = require("../controllers/Theater");
const { auth, isAdmin } = require("../middlewares/auth");

routes.post("/createTheater", auth, isAdmin, createTheater);
routes.get("/theaters", auth, isAdmin, getAllTheaters);
routes.delete("/theaters/:id", auth, isAdmin, deleteTheater);

module.exports = routes;