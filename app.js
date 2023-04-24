const express = require("express");

const connect = require("./config/db");
const HttpError = require("./models/http-error");

// Connect to MongoDB
connect();

const app = express();

app.use(express.json());

app.use("/api/users", require("./routes/api/users"));
app.use("/api/places", require("./routes/api/places"));

// Invalid Route
app.use((req, res, next) =>
    next(new HttpError("Could not find this route...", 404))
);

// Http-Error Handler
app.use((err, req, res, next) => {
    // already sent response
    if (res.headerSent) {
        return;
    }

    // send response
    const errMsg = err.message || "An Unknown Error Occurred...";
    const errCode = err.code || 500;
    res.status(errCode).json({ message: errMsg });
});

app.listen(4000, () => {
    console.log("Server started...");
});
