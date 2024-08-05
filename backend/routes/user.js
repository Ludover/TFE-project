const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = new User({
      email: req.body.email,
      password: hash,
      pseudo: req.body.pseudo,
    });
    user
      .save()
      .then((result) => {
        res.status(201).json({
          message: "User created!",
          result: result,
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });
});

router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "L'authentification a échoué",
        });
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((result) => {
      if (!result) {
        return res.status(401).json({
          message: "L'authentification a échoué",
        });
      }
      const token = jwt.sign(
        { email: fetchedUser.email, userId: fetchedUser._id },
        "secret_this_is_long",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        token: token,
        expiresIn: 3600,
      });
    })
    .catch((err) => {
      return res.status(401).json({
        message: "L'authentification a échoué",
      });
    });
});

// Ajouter un ami
router.post("/add-friend/:pseudo", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    const friend = await User.findOne({ pseudo: req.params.pseudo });

    if (!friend) {
      return res.status(404).json({ message: "Ami non trouvé" });
    }

    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: "Vous êtes déjà amis" });
    }

    user.friends.push(friend._id);
    await user.save();

    res.status(200).json({ message: "Ami ajouté avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'ami" });
  }
});

// Récupérer la liste des amis
router.get("/friends", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).populate("friends");
    res.status(200).json(user.friends);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des amis" });
  }
});

module.exports = router;
