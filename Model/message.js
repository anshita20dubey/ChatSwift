const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    msg: String,
    sender: String,
    receiver: String,
    time: {
        type: Date,
        default: Date.now()// Set the default value to the current date and time()
    }
});

module.exports = mongoose.model("message", messageSchema);
