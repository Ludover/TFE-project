const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, "secret_this_is_long");
    } catch (error) {
        res.status(401).json({ mesage: "L'authentification a échoué"});
    }

}