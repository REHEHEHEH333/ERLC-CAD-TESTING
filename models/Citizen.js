const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
    citizenId: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    dateOfBirth: Date,
    gender: String,
    licenseNumber: String,
    licenseExpiration: Date,
    height: String,
    weight: String,
    distinguishingFeatures: String,
    warrants: [{
        description: String,
        issueDate: Date,
        status: String,
    }],
    priorArrest: [{
        charge: String,
        date: Date,
        location: String,
        outcome: String,
    }],
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Citizen', citizenSchema);
