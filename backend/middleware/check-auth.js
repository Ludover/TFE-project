const jwt = require("jsonwebtoken");

// Middleware permettant de vérifier si un utilisateur est authentifié en utilisant un token JWT.
module.exports = (req, res, next) => {
  try {
    // Récupère le token d'authentification depuis les en-têtes de la requête.
    const token = req.headers.authorization.split(" ")[1];

    // Vérifie la validité du token en le décodant avec la clé secrète.
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    // Ajoute les informations de l'utilisateur décodées à l'objet de la requête.
    req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ mesage: "Vous n'êtes pas connecté!" });
  }
};
