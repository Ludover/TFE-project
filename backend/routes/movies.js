const express = require("express");

const Movie = require("../models/movie");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.post("", checkAuth, (req, res, next) => {
  const movie = new Movie({
    title: req.body.title,
    date: req.body.date,
    list: req.body.list,
    creator: req.userData.userId,
  });
  movie.save().then((createdMovie) => {
    res.status(201).json({
      message: "Movie added successfully",
      movieId: createdMovie._id,
    });
  });
});

router.put("/:id", checkAuth, (req, res, next) => {
  const updateData = {
    title: req.body.title,
    date: new Date(),
    list: req.body.list,
  };
  Movie.updateOne({ _id: req.params.id, creator: req.userData.userId }, updateData)
    .then((result) => {
      if (result.modifiedCount > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(404).json({ message: "Film not found!" });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Updating film failed!" });
    });
});

router.get("", (req, res, next) => {
  Movie.find().then((documents) => {
    res.status(200).json({
      message: "Movie fetched successfully",
      movies: documents,
    });
  });
});

router.get("/list/:listType", (req, res, next) => {
  Movie.find({ list: req.params.listType }).then((documents) => {
    res.status(200).json({
      message: "Films récupérés avec succès",
      movies: documents,
    });
  });
});

router.get("/:id", (req, res, next) => {
  Movie.findById(req.params.id).then((movie) => {
    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).json({ message: "Film introuvable" });
    }
  });
});

router.delete("/:id", checkAuth, (req, res, next) => {
  Movie.deleteOne({ _id: req.params.id, creator: req.userData.userId })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Movie not found" });
      }
      res.status(200).json({ message: "Movie deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: "Deleting movie failed", error: error });
    });
});

module.exports = router;
