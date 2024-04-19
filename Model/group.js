const mongoose = require("mongoose")

const groupSchema = mongoose.Schema({

    name:
    {
        type: String,
        require: true,
        unique: true
    }
    ,
    profileImage: {
        type: String,
        default: 'defaultgroup.jpg'
    },
    users:
        [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            }

        ]



})

module.exports = mongoose.model("group", groupSchema)