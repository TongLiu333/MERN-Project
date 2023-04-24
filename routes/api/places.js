const express = require("express");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");

const checkObjectId = require("../../middleware/checkObjectId");
const HttpError = require("../../models/http-error");
const auth = require("../../middleware/auth");
const Place = require("../../models/Place");
const User = require("../../models/User");

const router = express.Router();

/**
 * @route GET /api/places/user/:uid
 * @desc Get Places By User ID
 * @access Public
 */
router.get("/user/:uid", checkObjectId("uid"), async (req, res, next) => {
    const { uid } = req.params;

    try {
        const user = await User.findById(uid).populate("places");

        if (!user) return next(new HttpError("Not Found User.", 404));

        res.json(user.places.map((p) => p.toObject({ getters: true })));
    } catch (err) {
        console.log(err.message);
        next(new HttpError("Server failed", 500));
    }
});

/**
 * @route GET /api/places/:pid
 * @desc Get Place By Place ID
 * @access Public
 */
router.get("/:pid", checkObjectId("pid"), async (req, res, next) => {
    const { pid } = req.params;

    try {
        const place = await Place.findById(pid);

        if (!place) return next(new HttpError("Not Found Place.", 404));

        res.json(place.toObject({ getters: true }));
    } catch (err) {
        console.log(err.message);
        next(new HttpError(err.message || "Server failed", 500));
    }
});

/**
 * @route POST /api/places
 * @desc Create Post
 * @access Private
 */
router.post(
    "/",
    auth,
    [
        check("title").notEmpty(),
        check("description").notEmpty(),
        check("address").notEmpty(),
        check("image").notEmpty(),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json(errors);

        // destructure
        const { userId } = req.userData;

        try {
            // find user
            const user = await User.findById(userId);

            // create Place Object
            const place = new Place({ ...req.body, user: userId });

            // transanction
            const sess = await mongoose.startSession();
            sess.startTransaction();
            await place.save({ session: sess });
            user.places.unshift(place);
            await user.save({ session: sess });
            await sess.commitTransaction();

            res.json(place);
        } catch (err) {
            console.log(err.message);
            next(new HttpError(err.message || "Server failed", 500));
        }
    }
);

/**
 * @route PATCH /api/places/:pid
 * @decs Update Post By Place ID
 * @access Private
 */
router.patch(
    "/:pid",
    [
        auth,
        checkObjectId("pid"),
        check("title").notEmpty(),
        check("description").notEmpty(),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json(errors);

        const { pid } = req.params;
        const { userId } = req.userData;
        const { title, description } = req.body;

        try {
            const place = await Place.findById(pid);

            if (!place) return next(new HttpError("Not Found Place.", 404));

            if (place.user.toString() !== userId)
                return next(new HttpError("Unauthorized.", 401));

            place.title = title;
            place.description = description;
            await place.save();

            res.json(place);
        } catch (err) {
            console.log(err.message);
            next(new HttpError(err.message || "Server failed", 500));
        }
    }
);

/**
 * @route DELETE /api/places/:pid
 * @desc Delete Place By Place ID
 * @access Private
 */
router.delete("/:pid", [auth, checkObjectId("pid")], async (req, res, next) => {
    const { userId } = req.userData;
    const { pid } = req.params;

    try {
        const place = await Place.findById(pid).populate("user");

        if (!place) return next(new HttpError("Not Found Place.", 404));

        if (place.user.id.toString() !== userId)
            return next(new HttpError("Unauthorized.", 401));

        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.user.places.pull(place);
        await place.user.save({ session: sess });
        await sess.commitTransaction();

        res.json({ msg: "Deleted Place." });
    } catch (err) {
        console.log(err.message);
        next(new HttpError(err.message || "Server failed", 500));
    }
});

module.exports = router;
