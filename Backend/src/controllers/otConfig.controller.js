import OtConfigModel from '../models/otConfig.model.js';

export const getAllOtConfigs = async (req, res) => {
    try {
        const otConfigs = await OtConfigModel.findAll();
        res.json({ success: true, data: otConfigs });
    } catch (error) {
        console.error('Error fetching OT configs:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getOtConfigById = async (req, res) => {
    try {
        const { id } = req.params;
        const otConfig = await OtConfigModel.findById(id);

        if (!otConfig) {
            return res.status(404).json({ success: false, message: 'OT Config not found' });
        }

        res.json({ success: true, data: otConfig });
    } catch (error) {
        console.error('Error fetching OT config:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const createOtConfig = async (req, res) => {
    try {
        const { description, type_work_id, start_time, end_time, rate, hour, deduction_min, is_active } = req.body;

        if (!description || !type_work_id || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newOtConfig = await OtConfigModel.create({
            description,
            type_work_id,
            start_time,
            end_time,
            rate,
            hour,
            deduction_min,
            is_active
        });
        res.status(201).json({ success: true, data: newOtConfig, message: 'OT Config created successfully' });
    } catch (error) {
        console.error('Error creating OT config:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateOtConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, type_work_id, start_time, end_time, rate, hour, deduction_min, is_active } = req.body;

        const updated = await OtConfigModel.update(id, {
            description,
            type_work_id,
            start_time,
            end_time,
            rate,
            hour,
            deduction_min,
            is_active
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'OT Config not found or no changes made' });
        }

        res.json({ success: true, message: 'OT Config updated successfully' });
    } catch (error) {
        console.error('Error updating OT config:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteOtConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await OtConfigModel.remove(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'OT Config not found' });
        }

        res.json({ success: true, message: 'OT Config deleted successfully' });
    } catch (error) {
        console.error('Error deleting OT config:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
