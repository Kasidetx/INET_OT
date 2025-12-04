// src/controllers/otDetail.controller.js
import OtDetailModel from '../models/otDetail.model.js';
import OtModel from '../models/ot.model.js';

export const getAllDetails = async (req, res) => {
  try {
    const details = await OtDetailModel.findAll();
    
    res.json({
      success: true,
      data: details
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDetailsByOtId = async (req, res) => {
  try {
    const { id } = req.params; // ot id

    const header = await OtModel.findById(id);
    if (!header) {
      return res.status(404).json({ success: false, message: 'OT not found' });
    }

    const details = await OtDetailModel.findByOtId(id);

    res.json({
      success: true,
      data: {
        ot: header,
        details
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createDetailsForOt = async (req, res) => {
  try {
    const { id } = req.params; // ot id
    const details = req.body.details; // array ของ detail

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'details ต้องเป็น array' });
    }

    const header = await OtModel.findById(id);
    if (!header) {
      return res.status(404).json({ success: false, message: 'OT not found' });
    }

    // insert หลายแถว
    await OtDetailModel.createMany(id, details);

    // อัปเดต ot.total = sum(ot_hour) จากรายละเอียด
    const allDetails = await OtDetailModel.findByOtId(id);
    const totalHour = allDetails.reduce((sum, d) => sum + (d.ot_hour || 0), 0);

    await OtModel.update(id, {
      ...header,
      total: totalHour
    });

    res.status(201).json({
      success: true,
      data: {
        ot_id: id,
        total_hour: totalHour,
        details: allDetails
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
