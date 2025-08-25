const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middlewere/checkAuthentication");
const checkRole = require("../../middlewere/rbacMiddleware");
const adminMovieController = require("../../controller/ApiController/adminMovieController");

router.post(
  "/add-movie",
  authenticateToken,
  checkRole(["admin"]), adminMovieController.addMovie);

router.post(
  "/add-theater",
  authenticateToken,
  checkRole(["admin"]), adminMovieController.addTheater);

router.get(
  "/list-movie",
  authenticateToken,
  checkRole(["admin"]), adminMovieController.getAllMovies);

router.post(
  '/assign-movie-to-theater',
  authenticateToken,
  checkRole(['admin']), adminMovieController.assignMovieToTheater);

router.get(
  '/all-list-include-theater-and-timings',
  authenticateToken,
  checkRole(['admin']), adminMovieController.getAllMoviesWithTheater);

router.put(
  '/edit/:movieId',
  authenticateToken,
  checkRole(['admin']), adminMovieController.editMovie);

router.delete(
  '/delete/:movieId',
  authenticateToken,
  checkRole(['admin']), adminMovieController.deleteMovie);

module.exports = router