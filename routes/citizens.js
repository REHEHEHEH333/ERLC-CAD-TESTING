const Citizen = require('../models/Citizen');

const getCitizens = async (req, res) => {
    try {
        const citizens = await Citizen.find();
        res.json(citizens);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching citizens', error: error.message });
    }
};

const searchCitizens = async (req, res) => {
    try {
        const { query } = req.query;

        const citizens = await Citizen.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { citizenId: { $regex: query, $options: 'i' } },
                { licenseNumber: { $regex: query, $options: 'i' } },
            ],
        });

        res.json(citizens);
    } catch (error) {
        res.status(500).json({ message: 'Error searching citizens', error: error.message });
    }
};

const getCitizen = async (req, res) => {
    try {
        const citizen = await Citizen.findById(req.params.id);

        if (!citizen) {
            return res.status(404).json({ message: 'Citizen not found' });
        }

        res.json(citizen);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching citizen', error: error.message });
    }
};

const createCitizen = async (req, res) => {
    try {
        const { name, dateOfBirth, gender, licenseNumber, height, weight } = req.body;

        const lastCitizen = await Citizen.findOne().sort({ citizenId: -1 });
        const citizenIdNum = lastCitizen ? parseInt(lastCitizen.citizenId.split('-')[1]) + 1 : 1;
        const citizenId = `C-${String(citizenIdNum).padStart(5, '0')}`;

        const newCitizen = new Citizen({
            citizenId,
            name,
            dateOfBirth,
            gender,
            licenseNumber,
            height,
            weight,
        });

        await newCitizen.save();
        res.status(201).json(newCitizen);
    } catch (error) {
        res.status(500).json({ message: 'Error creating citizen', error: error.message });
    }
};

const addWarrant = async (req, res) => {
    try {
        const { description, issueDate, status } = req.body;

        const citizen = await Citizen.findById(req.params.id);
        if (!citizen) {
            return res.status(404).json({ message: 'Citizen not found' });
        }

        citizen.warrants.push({
            description,
            issueDate,
            status,
        });

        await citizen.save();
        res.json(citizen);
    } catch (error) {
        res.status(500).json({ message: 'Error adding warrant', error: error.message });
    }
};

const addArrestRecord = async (req, res) => {
    try {
        const { charge, date, location, outcome } = req.body;

        const citizen = await Citizen.findById(req.params.id);
        if (!citizen) {
            return res.status(404).json({ message: 'Citizen not found' });
        }

        citizen.priorArrest.push({
            charge,
            date,
            location,
            outcome,
        });

        await citizen.save();
        res.json(citizen);
    } catch (error) {
        res.status(500).json({ message: 'Error adding arrest record', error: error.message });
    }
};

module.exports = {
    getCitizens,
    searchCitizens,
    getCitizen,
    createCitizen,
    addWarrant,
    addArrestRecord,
};
