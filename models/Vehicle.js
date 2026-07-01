const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        unique: true,
        required: true,
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true,
    },
    vin: {
        type: String,
        required: true,
        unique: true,
    },
    make: String,
    model: String,
    year: Number,
    color: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citizen',
    },
    registered: {
        type: Boolean,
        default: true,
    },
    registrationExpiration: Date,
    insurance: {
        provider: String,
        policyNumber: String,
        expirationDate: Date,
    },
    flags: [{
        flag: String,
        reason: String,
        date: Date,
    }],
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
