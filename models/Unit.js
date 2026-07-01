const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    unitId: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    badge: {
        type: String,
        required: true,
    },
    officer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['available', 'busy', 'on-call', 'meal', '10-7'],
        default: 'available',
    },
    location: {
        type: String,
        default: 'Unknown',
    },
    currentCall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Call',
        default: null,
    },
    lastStatusUpdate: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Unit', unitSchema);
