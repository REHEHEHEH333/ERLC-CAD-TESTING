const Vehicle = require('../models/Vehicle');

const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find()
            .populate('owner');

        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
    }
};

const searchVehicles = async (req, res) => {
    try {
        const { query } = req.query;

        const vehicles = await Vehicle.find({
            $or: [
                { licensePlate: { $regex: query, $options: 'i' } },
                { vin: { $regex: query, $options: 'i' } },
                { make: { $regex: query, $options: 'i' } },
                { model: { $regex: query, $options: 'i' } },
            ],
        }).populate('owner');

        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Error searching vehicles', error: error.message });
    }
};

const getVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('owner');

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
    }
};

const createVehicle = async (req, res) => {
    try {
        const { licensePlate, vin, make, model, year, color, owner, registered } = req.body;

        const lastVehicle = await Vehicle.findOne().sort({ vehicleId: -1 });
        const vehicleIdNum = lastVehicle ? parseInt(lastVehicle.vehicleId.split('-')[1]) + 1 : 1;
        const vehicleId = `V-${String(vehicleIdNum).padStart(5, '0')}`;

        const newVehicle = new Vehicle({
            vehicleId,
            licensePlate,
            vin,
            make,
            model,
            year,
            color,
            owner,
            registered,
        });

        await newVehicle.save();
        res.status(201).json(newVehicle);
    } catch (error) {
        res.status(500).json({ message: 'Error creating vehicle', error: error.message });
    }
};

const addFlag = async (req, res) => {
    try {
        const { flag, reason } = req.body;

        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        vehicle.flags.push({
            flag,
            reason,
            date: Date.now(),
        });

        await vehicle.save();
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: 'Error adding flag', error: error.message });
    }
};

module.exports = {
    getVehicles,
    searchVehicles,
    getVehicle,
    createVehicle,
    addFlag,
};
