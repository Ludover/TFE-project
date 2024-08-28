const express = require("express");

const checkAuth = require("../middleware/check-auth");

const userController = require("../controllers/user");

const router = express.Router();

//#region Authentification

// Route pour créer un nouvel utilisateur.
router.post("/signup", userController.signUp);

router.post("/login", userController.login);

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
