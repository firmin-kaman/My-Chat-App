// Models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    channelName: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
