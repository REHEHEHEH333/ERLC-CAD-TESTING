const Unit = require('../models/Unit');

const getUnits = async (req, res) => {
    try {
        const units = await Unit.find()
            .populate('officer', 'name badge')
            .populate('currentCall');

        res.json(units);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching units', error: error.message });
    }
};

const getUnit = async (req, res) => {
    try {
        const unit = await Unit.findById(req.params.id)
            .populate('officer', 'name badge')
            .populate('currentCall');

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        res.json(unit);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unit', error: error.message });
    }
};

const createUnit = async (req, res) => {
    try {
        const { name, badge, officer } = req.body;

        const lastUnit = await Unit.findOne().sort({ unitId: -1 });
        const unitIdNum = lastUnit ? parseInt(lastUnit.unitId.split('-')[1]) + 1 : 1;
        const unitId = `U-${String(unitIdNum).padStart(3, '0')}`;

        const newUnit = new Unit({
            unitId,
            name,
            badge,
            officer,
        });

        await newUnit.save();
        req.io.emit('unit:created', newUnit);

        res.status(201).json(newUnit);
    } catch (error) {
        res.status(500).json({ message: 'Error creating unit', error: error.message });
    }
};

const updateUnitStatus = async (req, res) => {
    try {
        const { status, location } = req.body;

        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        if (status) unit.status = status;
        if (location) unit.location = location;
        unit.lastStatusUpdate = Date.now();

        await unit.save();
        req.io.emit('unit:updated', unit);

        res.json(unit);
    } catch (error) {
        res.status(500).json({ message: 'Error updating unit', error: error.message });
    }
};

const updateUnitLocation = async (req, res) => {
    try {
        const { location } = req.body;

        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        unit.location = location;
        unit.lastStatusUpdate = Date.now();

        await unit.save();
        req.io.emit('unit:location', unit);

        res.json(unit);
    } catch (error) {
        res.status(500).json({ message: 'Error updating unit location', error: error.message });
    }
};

module.exports = {
    getUnits,
    getUnit,
    createUnit,
    updateUnitStatus,
    updateUnitLocation,
};
