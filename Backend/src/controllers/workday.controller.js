import WorkdayModel from '../models/workday.model.js';

export const getAllWorkdays = async (req, res) => {
    try {
        const workdays = await WorkdayModel.findAll();
        res.json({ success: true, data: workdays });
    } catch (error) {
        console.error('Error fetching workdays:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getWorkdayById = async (req, res) => {
    try {
        const { id } = req.params;
        const workday = await WorkdayModel.findById(id);

        if (!workday) {
            return res.status(404).json({ success: false, message: 'Workday not found' });
        }

        res.json({ success: true, data: workday });
    } catch (error) {
        console.error('Error fetching workday:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const createWorkday = async (req, res) => {
    try {
        const { name, work_day, work_hour, start_time, end_time } = req.body;

        if (!name || !work_day || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newWorkday = await WorkdayModel.create({ name, work_day, work_hour, start_time, end_time });
        res.status(201).json({ success: true, data: newWorkday, message: 'Workday created successfully' });
    } catch (error) {
        console.error('Error creating workday:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateWorkday = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, work_day, work_hour, start_time, end_time } = req.body;

        const updated = await WorkdayModel.update(id, { name, work_day, work_hour, start_time, end_time });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Workday not found or no changes made' });
        }

        res.json({ success: true, message: 'Workday updated successfully' });
    } catch (error) {
        console.error('Error updating workday:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteWorkday = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await WorkdayModel.remove(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Workday not found' });
        }

        res.json({ success: true, message: 'Workday deleted successfully' });
    } catch (error) {
        console.error('Error deleting workday:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
