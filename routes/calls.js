const Call = require('../models/Call');
const Unit = require('../models/Unit');

const createCall = async (req, res) => {
    try {
        const { type, priority, location, description, caller, phone } = req.body;

        const lastCall = await Call.findOne().sort({ callId: -1 });
        const callIdNum = lastCall ? parseInt(lastCall.callId.split('-')[1]) + 1 : 1000;
        const callId = `CAL-${callIdNum}`;

        const newCall = new Call({
            callId,
            type,
            priority,
            location,
            description,
            caller,
            phone,
            dispatchedBy: req.user.id,
        });

        await newCall.save();
        req.io.emit('call:created', newCall);

        res.status(201).json(newCall);
    } catch (error) {
        res.status(500).json({ message: 'Error creating call', error: error.message });
    }
};

const getCalls = async (req, res) => {
    try {
        const calls = await Call.find()
            .populate('assignedUnits')
            .populate('dispatchedBy', 'name badge')
            .sort({ createdAt: -1 });

        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching calls', error: error.message });
    }
};

const getCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id)
            .populate('assignedUnits')
            .populate('dispatchedBy', 'name badge');

        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching call', error: error.message });
    }
};

const updateCall = async (req, res) => {
    try {
        const { status, location, description, priority } = req.body;

        const call = await Call.findById(req.params.id);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        if (status) call.status = status;
        if (location) call.location = location;
        if (description) call.description = description;
        if (priority) call.priority = priority;
        call.updatedAt = Date.now();

        if (status === 'closed') {
            call.closedAt = Date.now();
        }

        await call.save();
        req.io.emit('call:updated', call);

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'Error updating call', error: error.message });
    }
};

const assignUnit = async (req, res) => {
    try {
        const { unitId } = req.body;

        const call = await Call.findById(req.params.callId);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        const unit = await Unit.findById(unitId);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        if (!call.assignedUnits.includes(unitId)) {
            call.assignedUnits.push(unitId);
            call.status = 'assigned';
            unit.status = 'on-call';
            unit.currentCall = call._id;

            await call.save();
            await unit.save();

            req.io.emit('call:updated', call);
            req.io.emit('unit:updated', unit);
        }

        res.json({ call, unit });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning unit', error: error.message });
    }
};

const unassignUnit = async (req, res) => {
    try {
        const { unitId } = req.body;

        const call = await Call.findById(req.params.callId);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        call.assignedUnits = call.assignedUnits.filter(id => id.toString() !== unitId);

        const unit = await Unit.findById(unitId);
        if (unit) {
            unit.status = 'available';
            unit.currentCall = null;
            await unit.save();
            req.io.emit('unit:updated', unit);
        }

        await call.save();
        req.io.emit('call:updated', call);

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'Error unassigning unit', error: error.message });
    }
};

const addNote = async (req, res) => {
    try {
        const { text } = req.body;

        const call = await Call.findById(req.params.id);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        call.notes.push({
            text,
            officer: req.user.name,
            timestamp: Date.now(),
        });

        await call.save();
        req.io.emit('call:updated', call);

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'Error adding note', error: error.message });
    }
};

const closeCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        call.status = 'closed';
        call.closedAt = Date.now();

        for (const unitId of call.assignedUnits) {
            const unit = await Unit.findById(unitId);
            if (unit) {
                unit.status = 'available';
                unit.currentCall = null;
                await unit.save();
                req.io.emit('unit:updated', unit);
            }
        }

        await call.save();
        req.io.emit('call:updated', call);

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'Error closing call', error: error.message });
    }
};

module.exports = {
    createCall,
    getCalls,
    getCall,
    updateCall,
    assignUnit,
    unassignUnit,
    addNote,
    closeCall,
};
