const express = require("express");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const HttpError = require("../../models/http-error");

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get All Users
 * @access Public
 */
router.get("/", async (req, res, next) => {
    try {
        let users = await User.find({}, "-password");

        res.json(users.map((user) => user.toObject({ getters: true })));
    } catch (err) {
        console.log(err.message);
        next(new HttpError("Server failed", 500));
    }
});

/**
 * @route POST /api/users
 * @desc Register User & Get Token
 * @access Public
 */
router.post(
    "/",
    [
        check("name").notEmpty(),
        check("email").isEmail(),
        check("password").isLength({ min: 6 }),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json(errors);

        // destructure body
        const { name, email, password } = req.body;

        try {
            // check if email exists or not
            let user;
            user = await User.findOne({ email });
            if (user) return next(new HttpError("Email Already Existed.", 400));

            user = new User({ name, email, password });

            // get gravatar
            user.avatar = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

            // encrypt password
            const salt = await bcrypt.genSalt();
            user.password = await bcrypt.hash(password, salt);

            // store User
            await user.save();

            // return token
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
