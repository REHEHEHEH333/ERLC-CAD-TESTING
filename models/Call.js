const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    callId: {
        type: String,
        unique: true,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['welfare-check', 'noise', 'traffic-stop', 'assault', 'robbery', 'burglary', 'accident', 'suspicious', 'other'],
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'emergency'],
    },
    location: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    caller: {
        type: String,
        default: 'Anonymous',
    },
    phone: {
        type: String,
        default: 'Unknown',
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed'],
        default: 'pending',
    },
    assignedUnits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
    }],
    notes: [{
        text: String,
        officer: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],
    dispatchedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    closedAt: Date,
});

module.exports = mongoose.model('Call', callSchema);
