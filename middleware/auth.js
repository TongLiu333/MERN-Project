const jwt = require("jsonwebtoken");
const config = require("config");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
    // if token or not
    const token = req["x-auth-token"];
    if (token) {
        return next(new HttpError("No token, authentication denied...", 401));
    }

    // token valid or not
    try {
        const decoded = jwt.verify(token, config.get("token-key"));
        req.userData = { userId: decoded.userId };
        next();
    } catch (err) {
        console.log(err.message);
        next(new HttpError("Server failed", 500));
    }
};
