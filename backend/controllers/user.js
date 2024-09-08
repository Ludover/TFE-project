const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Joi = require("joi");
const validator = require("validator");

const User = require("../models/user");
const { sendEvent } = require("../middleware/sse-manager");

const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  pseudo: Joi.string().min(3).max(30).required(),
});

//#region Authentification

exports.signUp = async (req, res) => {
  const { error } = signUpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Vérification supplémentaire pour l'email et le pseudo
  if (!validator.isEmail(req.body.email)) {
    return res
      .status(400)
      .json({ message: "L'adresse email n'est pas valide." });
  }
  if (/\s/.test(req.body.pseudo)) {
    return res
      .status(400)
      .json({ message: "Le pseudo ne doit pas contenir d'espaces." });
  }

  try {
    // Vérifier si le pseudo ou l'adresse email existe déjà
    const existingUser = await User.findOne({
      $or: [
        { pseudo: req.body.pseudo.trim() },
        { email: req.body.email.toLowerCase().trim() },
      ],
    });

    if (existingUser) {
      if (existingUser.pseudo === req.body.pseudo.trim()) {
        return res
          .status(400)
          .json({ message: "Ce pseudo est déjà associé à un utilisateur." });
      }
      if (existingUser.email === req.body.email.toLowerCase().trim()) {
        return res
          .status(400)
          .json({ message: "Cette adresse email est déjà utilisée." });
      }
    }

    // Hacher le mot de passe
    const hash = await bcrypt.hash(req.body.password, 10);

    // Créer un nouvel utilisateur
    const user = new User({
      email: req.body.email.toLowerCase().trim(),
      password: hash,
      pseudo: req.body.pseudo.trim(),
    });

    const result = await user.save();
    res.status(201).json({
      message: "Utilisateur créé!",
      result: result,
    });
  } catch (err) {
    console.error("Erreur serveur lors de la création de l'utilisateur:", err);
    res.status(500).json({ message: "Erreur serveur, veuillez réessayer." });
  }
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(), // Max 128 pour protéger contre des formes de déni (tent d'augmenter le temps de calcul).
});

exports.login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  // Vérifiez que les données sont présentes
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe sont requis" });
  }

  try {
    // Cherchez l'utilisateur dans la base de données
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Si l'utilisateur n'existe pas, renvoyez une erreur
    if (!user) {
      return res.status(401).json({ message: "L'authentification a échoué" });
    }

    // Comparez le mot de passe avec le hash enregistré
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Si le mot de passe est incorrect, renvoyez une erreur
    if (!isPasswordValid) {
      return res.status(401).json({ message: "L'authentification a échoué" });
    }

    // Génération du token
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_KEY,
      { expiresIn: "3h" }
    );

    // Réponse avec le token et la durée d'expiration
    res.status(200).json({
      token: token,
      expiresIn: 3600,
      userId: user._id,
    });
  } catch (error) {
    // Gestion des erreurs inattendues
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Schéma de validation pour l'email
const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});

exports.forgotPassword = async (req, res) => {
  const { error } = emailSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: "Email invalide." });
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    const genericResponse = {
      message:
        "Si un compte avec cet email existe, un email a été envoyé pour réinitialiser le mot de passe.",
    };

    if (!user) {
      return res.status(404).json(genericResponse);
    }

    // Vérifie si un jeton de réinitialisation est déjà en cours et valide.
    if (
      user.resetToken &&
      user.resetTokenExpiration &&
      user.resetTokenExpiration > Date.now()
    ) {
      return res.status(429).json({
        message:
          "Une demande de réinitialisation a déjà été faite récemment. Veuillez réessayer plus tard.",
      });
    }

    // Génére un jeton de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = Date.now() + 3600000; // 1 heure

    // Sauvegarde le jeton dans la base de données
    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    // Envoie de l'email
    var transporter = nodemailer.createTransport({
      service: "iCloud",
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_SUPPORT,
      subject: "Réinitialisation de mot de passe",
      html: `<p>Vous avez demandé une réinitialisation de mot de passe.</p>
             <p>Cliquez sur ce <a href="http://www.monpopcorn.com/reset-password/${resetToken}">lien</a> pour réinitialiser votre mot de passe.</p>`,
    };

    transporter
      .sendMail(mailOptions)
      .then((info) => {
        res.status(200).json(genericResponse);
      })
      .catch((error) => {
        console.error("Erreur lors de l’envoi de l’email:", error);
        res.status(500).json({ message: "Échec de l’envoi de l’email." });
      });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res
      .status(500)
      .json({ message: "Erreur serveur, veuillez réessayer plus tard." });
  }
};

// Schéma de validation pour le mot de passe
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

exports.resetPassword = async (req, res) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Les données fournies sont invalides." });
  }

  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Le lien de réinitialisation est invalide ou a expiré.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Réinitialise le jeton et sa date d'expiration après l'utilisation
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    await user.save();
    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//#endregion

//#region Friends

exports.getId = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const user = await User.findById(userId).select("_id"); // Récupère uniquement le champ id

    if (user) {
      res.status(200).json({ id: user._id });
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé." });
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'ID utilisateur :",
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du pseudo." });
  }
};

exports.getPseudo = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const user = await User.findById(userId).select("pseudo"); // Récupère uniquement le champ pseudo

    if (user) {
      res.status(200).json({ pseudo: user.pseudo });
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé." });
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du pseudo utilisateur :",
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du pseudo." });
  }
};

exports.getFriend = async (req, res, next) => {
  try {
    const authUserId = req.userData.userId;
    const searchPseudo = req.params.pseudo.trim();

    if (searchPseudo.length < 3) {
      return res
        .status(400)
        .json({ message: "Le pseudo doit contenir au moins 3 caractères." });
    }

    // Utilisation d'une expression régulière pour une recherche partielle et insensible à la casse
    const users = await User.find({
      pseudo: { $regex: new RegExp(searchPseudo, "i") }, // 'i' pour insensibilité à la casse
    })
      .select("pseudo")
      .limit(10);

    if (users.length > 0) {
      // Filtrer les résultats pour exclure l'utilisateur authentifié
      const filteredUsers = users.filter(
        (user) => user._id.toString() !== authUserId
      );

      if (filteredUsers.length > 0) {
        res.status(200).json(filteredUsers);
      } else {
        res
          .status(400)
          .json({ message: "Aucun utilisateur trouvé avec ce pseudo." });
      }
    } else {
      res
        .status(404)
        .json({ message: "Aucun utilisateur trouvé avec ce pseudo." });
    }
  } catch (error) {
    console.error(
      "Erreur lors de la recherche d'utilisateur par pseudo :",
      error
    );
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'utilisateur." });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const friendId = req.params.friendId;

    if (userId === friendId) {
      return res.status(400).json({
        message: "Vous ne pouvez pas vous envoyer une demande d'ami.",
      });
    }

    const user = await User.findById(userId).select("friendRequestsSent");
    const friend = await User.findById(friendId).select(
      "friendRequestsReceived"
    );

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

    // Envoie un événement SSE à l'ami pour notifier la demande d'ami
    sendEvent(friendId, "friendRequest", { from: userId });

    res.status(200).json({ message: "Demande d'ami envoyée." });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande d'ami :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const userIdToAccept = req.params.userId;

    if (userId === userIdToAccept) {
      return res.status(400).json({
        message: "Vous ne pouvez pas accepter une demande d'ami de vous-même.",
      });
    }

    const user = await User.findById(userId);
    const userToAccept = await User.findById(userIdToAccept);

    if (!user || !userToAccept) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (!user.friendRequestsReceived.includes(userIdToAccept)) {
      return res.status(400).json({ message: "Aucune demande d'ami reçue." });
    }

    user.friends.push({
      friendId: userIdToAccept,
      friendPseudo: userToAccept.pseudo,
    });
    userToAccept.friends.push({ friendId: userId, friendPseudo: user.pseudo });

    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (id) => id.toString() !== userIdToAccept.toString()
    );
    userToAccept.friendRequestsSent = userToAccept.friendRequestsSent.filter(
      (id) => id.toString() !== userId.toString()
    );

    await user.save();
    await userToAccept.save();

    res.status(200).json({ message: "Demande d'ami acceptée." });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la demande d'ami :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const userIdToReject = req.params.userId;

    if (userId === userIdToReject) {
      return res.status(400).json({
        message: "Vous ne pouvez pas rejeter une demande d'ami de vous-même.",
      });
    }

    const user = await User.findById(userId);
    const userToReject = await User.findById(userIdToReject);

    if (!user || !userToReject) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (!user.friendRequestsReceived.includes(userIdToReject)) {
      return res.status(400).json({ message: "Aucune demande d'ami reçue." });
    }

    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (id) => id.toString() !== userIdToReject.toString()
    );
    userToReject.friendRequestsSent = userToReject.friendRequestsSent.filter(
      (id) => id.toString() !== userId.toString()
    );

    await user.save();
    await userToReject.save();

    res.status(200).json({ message: "Demande d'ami rejetée." });
  } catch (error) {
    console.error("Erreur lors du rejet de la demande d'ami :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.cancelFriendRequest = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const friendId = req.params.friendId;

    // Trouver l'utilisateur actuel
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Utilisateur non trouvé : ${userId}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifie si la demande d'ami est bien présente dans les demandes envoyées
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
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId)
      .populate("friends.friendId", "pseudo")
      .select("friends");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Erreur lors de la récupération des amis:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des amis." });
  }
};

exports.friendRequestsSent = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).populate(
      "friendRequestsSent"
    );
    res.status(200).json(user.friendRequestsSent);
  } catch (error) {
    console.error("Erreur lors de la récupération des amis:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des demande d'amis envoyées.",
    });
  }
};

exports.friendRequestsReceived = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).populate(
      "friendRequestsReceived"
    );
    res.status(200).json(user.friendRequestsReceived);
  } catch (error) {
    console.error("Erreur lors de la récupération des amis:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des des demande d'amis reçues.",
    });
  }
};

exports.removeFriend = async (req, res) => {
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
    user.friends = user.friends.filter(
      (friend) => friend.friendId.toString() !== friendId
    );

    // Supprimer l'utilisateur de la liste des amis de l'ami
    friend.friends = friend.friends.filter(
      (friend) => friend.friendId.toString() !== userId
    );

    // Sauvegarder les modifications
    await user.save();
    await friend.save();

    res.status(200).json({ message: "Ami supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression d'ami:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getIsFriend = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const friendId = req.params.userId;

    // Trouver l'utilisateur actuel
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si friendId est dans la liste des amis de l'utilisateur
    const isFriend = user.friends.includes(friendId);
    res.status(200).json(isFriend);
  } catch (error) {
    console.error("Erreur lors de la vérification de l'ami :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//#endregion

//#region Movies

exports.addMovie = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const { title, id } = req.body;

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le film existe déjà dans la liste "tosee"
    const movieExists = user.movies.some(
      (movie) => movie.tmdbId === id.toString() && movie.list === "tosee"
    );

    if (movieExists) {
      return res
        .status(400)
        .json({ message: "Ce film est déjà dans votre liste à voir." });
    }

    // Ajouter le film à la liste "tosee"
    user.movies.push({
      title: title,
      date: new Date(),
      list: "tosee",
      tmdbId: id,
    });
    await user.save();

    res.status(201).json({ message: "Film ajouté avec succès" });
  } catch (error) {
    res.status(500).json({ message: "L'ajout du film a échoué" });
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const movieId = req.params.id;

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Filtrer la liste des films pour supprimer celui avec l'ID donné
    const updatedMovies = user.movies.filter(
      (movie) => movie._id.toString() !== movieId
    );

    // Vérifier si un film a été supprimé
    if (updatedMovies.length === user.movies.length) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    user.movies = updatedMovies;
    await user.save();

    res.status(200).json({ message: "Film supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du film" });
  }
};

exports.updateMovie = (req, res) => {
  const userId = req.userData.userId;
  const movieId = req.params.id;
  const tmdbId = req.body.movie.tmdbId;
  const list = req.body.list;
  const date = req.body.movie.date;
  const dateSeen = list === "seen" ? new Date() : null;
  const listInFrench = list === "tosee" ? "à voir" : "vu";

  User.findOne({ _id: userId, "movies._id": movieId })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ message: "Film non trouvé dans la liste." });
      }

      // Vérifier si le film existe déjà dans la liste "tosee"
      const movieExists = user.movies.some(
        (movie) => movie.tmdbId === tmdbId && movie.list === list
      );

      if (movieExists) {
        return res.status(400).json({
          message: "Ce film est déjà dans votre liste " + listInFrench,
        });
      }

      const movieIndex = user.movies.findIndex(
        (movie) => movie._id.toString() === movieId
      );
      if (movieIndex > -1) {
        user.movies[movieIndex].list = list;
        user.movies[movieIndex].date = date;
        user.movies[movieIndex].dateSeen = dateSeen;
        return user.save().then((result) => {
          res.status(200).json({
            message: "Film mis à jour avec succès.",
            movie: result.movies[movieIndex], // Retourne le film mis à jour
          });
        });
      } else {
        return res.status(404).json({ message: "Film non trouvé." });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "La mise à jour du film a échoué." });
    });
};

exports.getMoviesList = async (req, res, next) => {
  const userId = req.userData.userId;
  const listType = req.params.listType;
  const pageSize = parseInt(req.query.pagesize, 10);
  const currentPage = parseInt(req.query.page, 10);

  try {
    // Trouver l'utilisateur actuel
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Filtrer les films selon le type de liste
    let movies = user.movies.filter((movie) => movie.list === listType);
    const maxMovies = movies.length;
    // Appliquer la pagination
    if (pageSize > 0 && currentPage > 0) {
      const startIndex = pageSize * (currentPage - 1);
      movies = movies.slice(startIndex, startIndex + pageSize);
    }

    // Envoyer la réponse avec les films paginés et le nombre total de films
    res.status(200).json({
      movies: movies,
      maxMovies: maxMovies,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des films" });
  }
};

exports.shareMovie = async (req, res) => {
  const { friendId, movieTitle, date, tmdbId, friendComment } = req.body;
  const userId = req.userData.userId;
  try {
    // Trouver l'utilisateur actuel
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Trouver l'ami avec lequel partager le film
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Ami non trouvé." });
    }

    // Vérifier si le film est déjà recommandé à l'ami
    const isAlreadyRecommended = friend.movies.some(
      (movie) => movie.title === movieTitle && movie.list === "recommended"
    );
    if (isAlreadyRecommended) {
      return res
        .status(400)
        .json({ message: "Ce film a déjà été conseillé à cet ami." });
    }

    // Créer le film à recommander
    const recommendedMovie = {
      title: movieTitle,
      date: date,
      list: "recommended",
      creator: user.pseudo,
      tmdbId: tmdbId,
      friendComment: friendComment,
    };

    // Ajouter le film recommandé à la liste de l'ami
    friend.movies.push(recommendedMovie);
    await friend.save();

    // Envoyer un événement SSE à l'ami pour notifier le partage de film
    sendEvent(friendId, "movieShared", { movie: recommendedMovie });

    res.status(200).json({ message: "Film partagé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du partage de film" });
  }
};

exports.moveMovieToNormalList = async (req, res, next) => {
  const { title } = req.body;
  const userId = req.userData.userId;
  try {
    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Trouver le film recommandé à déplacer
    const movieIndex = user.moviesRecommended.findIndex(
      (movie) => movie.title === title
    );
    if (movieIndex === -1) {
      return res.status(404).json({ message: "Film recommandé non trouvé" });
    }

    // Récupérer le film recommandé à partir de la liste recommandée
    const movieToMove = user.moviesRecommended[movieIndex];

    // Ajouter le film à la liste normale
    user.movies.push(movieToMove);

    // Supprimer le film de la liste recommandée
    user.moviesRecommended.splice(movieIndex, 1);

    await user.save();

    res
      .status(200)
      .json({ message: "Film déplacé avec succès vers la liste normale" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.getRandomMovie = async (req, res, next) => {
  const userId = req.userData.userId;

  try {
    // Trouver l'utilisateur actuel
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Filtrer les films dans la liste "tosee"
    const toseeMovies = user.movies.filter((movie) => movie.list === "tosee");
    const maxMovies = toseeMovies.length;

    if (maxMovies === 0) {
      return res
        .status(404)
        .json({ message: "Aucun film trouvé dans la liste à voir." });
    }

    // Choisir un film aléatoire
    const randomIndex = Math.floor(Math.random() * maxMovies);
    const randomMovie = toseeMovies[randomIndex];

    // Envoyer la réponse avec le film aléatoire
    res.status(200).json({
      movie: randomMovie,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du film" });
  }
};

//#endregion
