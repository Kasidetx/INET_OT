import EmpModel from "../models/emp.model.js";

export const getAllEmp = async (req, res) => {
    try {
        const data = await EmpModel.findAll();
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error getAllEmp' });
    }
}

