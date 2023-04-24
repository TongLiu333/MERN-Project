const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String },
    places: [
        { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Place" },
    ],
});

module.exports = mongoose.model("User", userSchema);
