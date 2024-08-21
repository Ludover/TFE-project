const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

//#region Authentification

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

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Vérifiez que les données sont présentes
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe sont requis" });
  }

  try {
    // Cherchez l'utilisateur dans la base de données
    const user = await User.findOne({ email: email });

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
      "secret_this_is_long",
      { expiresIn: "1h" }
    );

    // Réponse avec le token et la durée d'expiration
    res.status(200).json({
      token: token,
      expiresIn: 3600,
    });
  } catch (error) {
    // Gestion des erreurs inattendues
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//#endregion

//#region Friends

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

// Récupérer la liste des demandes d'amis envoyées.
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

// Récupérer la liste des demandes d'amis reçues.
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

// Vérifie si un utilisateur est déjà dans la liste des amis
router.get("/is-friend/:userId", checkAuth, async (req, res) => {
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
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

//#endregion

//#region Movies

router.post("/add-movie", checkAuth, async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const { Title, imdbID } = req.body;
    console.log(req.body);
    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si le film existe déjà dans la liste "tosee"
    const movieExists = user.movies.some(
      (movie) => movie.title === Title && movie.list === "tosee"
    );

    if (movieExists) {
      return res
        .status(400)
        .json({ message: "Ce film est déjà dans votre liste à voir." });
    }

    // Ajouter le film à la liste "tosee"
    user.movies.push({
      title: Title,
      date: new Date(),
      list: "tosee",
      imdbId: imdbID,
    });
    await user.save();

    res.status(201).json({ message: "Film ajouté avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.delete("/delete-movie/:id", checkAuth, async (req, res, next) => {
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
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// Mettre à jour la liste d'un film (de 'tosee' à 'seen')
router.put("/update-movie/:title", checkAuth, (req, res) => {
  const userId = req.userData.userId;
  const title = req.body.title;
  const list = req.body.list;
  const date = req.body.date;

  User.findOne({ _id: userId, "movies.title": title })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ message: "Film non trouvé dans la liste." });
      }

      // Vérifier si le film existe déjà dans la liste "tosee"
      const movieExists = user.movies.some(
        (movie) => movie.title === title && movie.list === list
      );

      if (movieExists) {
        return res
          .status(400)
          .json({ message: "Ce film est déjà dans votre liste à voir." });
      }

      const movieIndex = user.movies.findIndex(
        (movie) => movie.title === title
      );
      if (movieIndex > -1) {
        user.movies[movieIndex].list = list;
        user.movies[movieIndex].date = date;
        return user.save().then((result) => {
          res.status(200).json({
            message: "Film mis à jour avec succès.",
            movie: result.movies,
          });
        });
      } else {
        return res.status(404).json({ message: "Film non trouvé." });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "La mise à jour du film a échoué." });
    });
});

// router.put("/update-movie/:title", checkAuth, async (req, res, next) => {
//   const userId = req.userData.userId;
//   const movieTitle = req.params.title;
//   const { newList } = req.body;

//   try {
//     // Trouver l'utilisateur actuel
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "Utilisateur non trouvé." });
//     }

//     // Trouver le film dans la liste 'tosee'
//     const movieIndex = user.movies.findIndex(
//       (movie) => movie.title === movieTitle && movie.list === "tosee"
//     );
//     if (movieIndex === -1) {
//       return res
//         .status(404)
//         .json({ message: 'Film non trouvé dans la liste "tosee".' });
//     }

//     // Mettre à jour la liste du film
//     user.movies[movieIndex].list = newList;
//     await user.save();

//     res.status(200).json({
//       message: "Film mis à jour avec succès.",
//       movie: user.movies[movieIndex],
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Erreur serveur.", error });
//   }
// });

router.get("/movies/list/:listType", checkAuth, async (req, res, next) => {
  const userId = req.userData.userId;
  const listType = req.params.listType;
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;

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
    if (pageSize && currentPage) {
      const startIndex = pageSize * (currentPage - 1);
      movies = movies.slice(startIndex, startIndex + pageSize);
    }

    // Envoyer la réponse avec les films paginés et le nombre total de films
    res.status(200).json({
      message: "Films récupérés avec succès.",
      movies: movies,
      maxMovies: maxMovies,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error });
  }
});

// Route pour partager un film
router.post("/share-movie", checkAuth, async (req, res, next) => {
  const { friendId, movieTitle, date, imdbId } = req.body;
  const userId = req.userData.userId;
  console.log(req.body);
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
      imdbId: imdbId,
    };

    // Ajouter le film recommandé à la liste de l'ami
    friend.movies.push(recommendedMovie);
    await friend.save();

    res.status(200).json({ message: "Film partagé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error });
  }
});

// router.get("/movies-recommended", checkAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.userData.userId).select(
//       "moviesRecommended"
//     );
//     if (!user) {
//       return res.status(404).json({ message: "Utilisateur non trouvé" });
//     }
//     res.status(200).json({
//       movies: user.moviesRecommended,
//     });
//   } catch (error) {
//     console.error(
//       "Erreur lors de la récupération des films recommandés :",
//       error
//     );
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// });

// router.delete(
//   "/delete-movie-recommended/:title",
//   checkAuth,
//   async (req, res, next) => {
//     try {
//       const userId = req.userData.userId;
//       const movieTitle = req.params.title;

//       // Trouver l'utilisateur
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "Utilisateur non trouvé" });
//       }

//       // Filtrer la liste des films pour supprimer celui avec le titre donné
//       user.moviesRecommended = user.moviesRecommended.filter(
//         (movie) => movie.title !== movieTitle
//       );
//       await user.save();

//       res.status(200).json({ message: "Film supprimé avec succès" });
//     } catch (error) {
//       res.status(500).json({ message: "Erreur serveur", error });
//     }
//   }
// );

router.post("/move-movie-to-normal-list", checkAuth, async (req, res, next) => {
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
});

//#endregion

module.exports = router;
