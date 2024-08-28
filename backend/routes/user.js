const express = require("express");

const nodemailer = require("nodemailer");
const crypto = require("crypto");

const checkAuth = require("../middleware/check-auth");

const userController = require("../controllers/user");

const router = express.Router();

//#region Authentification

// Route pour créer un nouvel utilisateur.
router.post("/signup", userController.signUp);

router.post("/login", userController.login);

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Générer un jeton de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = Date.now() + 3600000; // 1 heure

    // Sauvegarder le jeton dans la base de données
    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    // Envoyer l'email
    const transporter = nodemailer.createTransport({
      service: "Outlook",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Réinitialisation de mot de passe",
      html: `<p>Vous avez demandé une réinitialisation de mot de passe.</p>
             <p>Cliquez sur ce <a href="http://localhost:4200/reset-password/${resetToken}">lien</a> pour réinitialiser votre mot de passe.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(info);
    res.status(200).json({
      message: "Un email a été envoyé pour réinitialiser votre mot de passe.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur serveur, veuillez réessayer plus tard." });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Jeton invalide ou expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    await user.save();
    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//#endregion

//#region Friends

// Route pour récupérer l'id de .
router.get("/id", checkAuth, userController.getId);

// Route pour récupérer le pseudo.
router.get("/pseudo", checkAuth, userController.getPseudo);

// Rechercher un utilisateur par pseudo.
router.get("/search/:pseudo", checkAuth, userController.getFriend);

// Route pour envoyer une demande d'ami.
router.post("/send-friend-request/:friendId", checkAuth, userController.sendFriendRequest);

router.post("/accept-friend-request/:userId", checkAuth, userController.acceptFriendRequest);

// Route pour refuser une demande d'ami.
router.post("/reject-friend-request/:userId", checkAuth, userController.rejectFriendRequest);

// Route pour annuler une demande d'ami.
router.post("/cancel-friend-request/:friendId", checkAuth, userController.cancelFriendRequest);

// Route pour récupérer la liste des amis.
router.get("/friends", checkAuth, userController.getFriends);

// Route pour récupérer la liste des demandes d'amis envoyées.
router.get("/friendRequestsSent", checkAuth, userController.friendRequestsSent);

// Route pour récupérer la liste des demandes d'amis reçues.
router.get("/friendRequestsReceived", checkAuth, userController.friendRequestsReceived);

// Route pour supprimer un ami.
router.delete("/remove-friend/:friendId", checkAuth, userController.removeFriend);

// Vérifie si un utilisateur est déjà dans la liste des amis
router.get("/is-friend/:userId", checkAuth, userController.getIsFriend);

//#endregion

//#region Movies

// Route pour ajouter un film via la recherche de film.
router.post("/add-movie", checkAuth, userController.addMovie);

// Route pour supprimer un film via l'id.
router.delete("/delete-movie/:id", checkAuth, userController.deleteMovie);

// Route pour mettre à jour la liste d'un film (de 'tosee' à 'seen' ou de 'recommended' à 'tosee').
router.put("/update-movie/:id", checkAuth, userController.updateMovie);

// Route pour récupérer les films en fonction de la liste.
router.get("/movies/list/:listType", checkAuth, userController.getMoviesList);

// Route pour partager un film
router.post("/share-movie", checkAuth, userController.shareMovie);

router.post("/move-movie-to-normal-list", checkAuth, userController.moveMovieToNormalList);

// Nouvelle route pour récupérer un film aléatoire de la liste "tosee"
router.get("/movies/random/tosee", checkAuth, userController.getRandomMovie);

//#endregion

module.exports = router;
