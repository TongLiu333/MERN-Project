const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const User = require("../../models/User");
const HttpError = require("../../models/http-error");

const router = express.Router();

/**
 * @route GET /api/auth
 * @desc Get User By Token
 * @access Private
 */
router.get("/", auth, async (req, res, next) => {
    const { userId } = req.userData;

    try {
        const user = await User.findById(userId, "-password");
        res.json(user.toObject({ getters: true }));
    } catch (err) {
        console.log(err.message);
        next(new HttpError("Server failed", 500));
    }
});

/**
 * @route POST /api/auth
 * @desc Log In User & Get Token
 * @access Public
 */
router.post(
    "/",
    [check("email").isEmail(), check("password").notEmpty()],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json(errors);

        const { email, password } = req.body;

        try {
            // user exist or not
            const user = await User.findOne({ email });
            if (!user) return next(new HttpError("Not Found Email.", 404));

            // password valid or not
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return next(new HttpError("Invalid Credentials.", 401));

            // generate token
            const token = jwt.sign(
                { userId: user.id },
                config.get("token-key"),
                { expiresIn: "1h" }
            );
            res.json({ token });
        } catch (err) {
            console.log(err.message);
            next(new HttpError("Server failed", 500));
        }
    }
);

module.exports = router;
