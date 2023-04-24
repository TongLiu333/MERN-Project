const mongoose = require("mongoose");
const config = require("config");

module.exports = connect = async () => {
    try {
        // connect
        await mongoose.connect(config.get("mongo-url"));
        console.log("MongoDB connected...");
    } catch (error) {
        console.log(error.message);
        // terminate the process, if failed
        process.exit(1);
    }
};
