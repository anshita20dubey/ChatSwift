const mongoose = require('mongoose');
const plm = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
    username: String,
    profileImage: {
        type: String,
        default: 'defaultuser.jpg',
    },
    socketId: String,
});

userSchema.plugin(plm);

module.exports = mongoose.model('user',userSchema);