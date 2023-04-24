const mongoose = require("mongoose");

const HttpError = require("../models/http-error");

module.exports = (idToCheck) => (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[idToCheck]))
        return next(new HttpError("Invalid OjectId.", 400));

    next();
};
