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

router.get("/pseudo", checkAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;
    const user = await User.findById(userId).select("pseudo"); // Récupère uniquement le champ pseudo

    if (user) {
      res.status(200).json({ pseudo: user.pseudo });
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé." });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// Rechercher un utilisateur par pseudo
router.get("/search/:pseudo", checkAuth, async (req, res, next) => {
  try {
    const authUserId = req.userData.userId;
    // Rechercher l'utilisateur par pseudo (insensible à la casse)
    const user = await User.findOne({
      pseudo: new RegExp(`^${req.params.pseudo}$`, "i"),
    });

    if (user) {
      if (user._id.toString() === authUserId) {
        return res
          .status(400)
          .json({ message: "Vous ne pouvez pas vous ajouter comme ami." });
      }
      res.status(200).json(user); // Retourner l'utilisateur trouvé
    } else {
      res
        .status(404)
        .json({ message: "Aucun utilisateur trouvé avec ce pseudo." });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post("/send-friend-request/:friendId", checkAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;
    const friendId = req.params.friendId;

    if (userId === friendId) {
      return res.status(400).json({
        message: "Vous ne pouvez pas vous envoyer une demande d'ami.",
      });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (user.friendRequestsSent.includes(friendId)) {
      return res.status(400).json({ message: "Demande d'ami déjà envoyée." });
    }

    user.friendRequestsSent.push(friendId);
    friend.friendRequestsReceived.push(userId);

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Demande d'ami envoyée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post("/accept-friend-request/:userId", checkAuth, async (req, res) => {
  try {
    const currentUserId = req.userData.userId;
    const userIdToAccept = req.params.userId;

    if (currentUserId === userIdToAccept) {
      return res.status(400).json({
        message: "Vous ne pouvez pas accepter une demande d'ami de vous-même.",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const userToAccept = await User.findById(userIdToAccept);

    if (!currentUser || !userToAccept) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (!currentUser.friendRequestsReceived.includes(userIdToAccept)) {
      return res.status(400).json({ message: "Aucune demande d'ami reçue." });
    }

    currentUser.friends.push(userIdToAccept);
    userToAccept.friends.push(currentUserId);

    currentUser.friendRequestsReceived =
      currentUser.friendRequestsReceived.filter(
        (id) => id.toString() !== userIdToAccept.toString()
      );
    userToAccept.friendRequestsSent = userToAccept.friendRequestsSent.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await userToAccept.save();

    res.status(200).json({ message: "Demande d'ami acceptée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post("/reject-friend-request/:userId", checkAuth, async (req, res) => {
  try {
    const currentUserId = req.userData.userId;
    const userIdToReject = req.params.userId;

    if (currentUserId === userIdToReject) {
      return res.status(400).json({
        message: "Vous ne pouvez pas rejeter une demande d'ami de vous-même.",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const userToReject = await User.findById(userIdToReject);

    if (!currentUser || !userToReject) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (!currentUser.friendRequestsReceived.includes(userIdToReject)) {
      return res.status(400).json({ message: "Aucune demande d'ami reçue." });
    }

    currentUser.friendRequestsReceived =
      currentUser.friendRequestsReceived.filter(
        (id) => id.toString() !== userIdToReject.toString()
      );
    userToReject.friendRequestsSent = userToReject.friendRequestsSent.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await userToReject.save();

    res.status(200).json({ message: "Demande d'ami rejetée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// Route pour annuler une demande d'ami
router.post(
  "/cancel-friend-request/:friendId",
  checkAuth,
  async (req, res, next) => {
    try {
      const userId = req.userData.userId;
      const friendId = req.params.friendId;

      // Trouver l'utilisateur actuel
      const user = await User.findById(userId);
      if (!user) {
        console.error(`Utilisateur non trouvé : ${userId}`);
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Vérifier si la demande d'ami est bien présente dans les demandes envoyées
      if (!user.friendRequestsSent.includes(friendId)) {
        console.error(
          `Demande d'ami non trouvée pour ${friendId} dans les demandes envoyées`
        );
        return res.status(400).json({ message: "Demande d'ami non trouvée" });
      }

      // Supprimer la demande d'ami des demandes envoyées
      user.friendRequestsSent = user.friendRequestsSent.filter(
        (id) => id.toString() !== friendId
      );
      await user.save();

      // Trouver l'utilisateur qui a reçu la demande
      const friend = await User.findById(friendId);
      if (friend) {
        // Supprimer la demande d'ami des demandes reçues
        friend.friendRequestsReceived = friend.friendRequestsReceived.filter(
          (id) => id.toString() !== userId
        );
        await friend.save();
      } else {
        console.error(`Utilisateur non trouvé pour ${friendId}`);
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.status(200).json({ message: "Demande d'ami annulée" });
    } catch (error) {
      console.error("Erreur serveur", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  }
);

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

// Récupérer la liste des amis
router.get("/friendRequestsSent", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).populate(
      "friendRequestsSent"
    );
    res.status(200).json(user.friendRequestsSent);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des amis" });
  }
});

// Récupérer la liste des amis
router.get("/friendRequestsReceived", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).populate(
      "friendRequestsReceived"
    );
    res.status(200).json(user.friendRequestsReceived);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des amis" });
  }
});

// Route pour supprimer un ami
router.delete("/remove-friend/:friendId", checkAuth, async (req, res) => {
  try {
    const userId = req.userData.userId;
    const friendId = req.params.friendId;

    // Trouver l'utilisateur et l'ami
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Supprimer l'ami de la liste des amis de l'utilisateur
    user.friends = user.friends.filter((id) => id.toString() !== friendId);

    // Supprimer l'utilisateur de la liste des amis de l'ami
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    // Sauvegarder les modifications
    await user.save();
    await friend.save();

    res.status(200).json({ message: "Ami supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

module.exports = router;
