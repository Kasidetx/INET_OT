// src/controllers/ot.controller.js
import OtModel from '../models/ot.model.js'
import OtDetailModel from '../models/otDetail.model.js';
import OtConfigModel from '../models/otConfig.model.js';
import HolidayModel from '../models/holiday.model.js';
import dayjs from 'dayjs';

const formatDateForMySQL = (dateObj) => dayjs(dateObj).format('YYYY-MM-DD HH:mm:ss');

export const getAllEmployee = async (req, res) => {
  try {
    // รับค่า ?emp_id=xxx จาก URL
    const { emp_id } = req.query; 

    // ส่งให้ Model (Model จะตัดสินใจเองว่าถ้าเป็น null คือดึงทั้งหมด)
    const data = await OtModel.AllEmployee(emp_id);
    
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error getAllEmployee:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export const getRequest = async (req, res) => {
  try {
    const data = await OtModel.requestOt()
    res.json({ success: true, data})
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error getRequest' })
  }
}

export const getOtById = async (req, res) => {
  try {
    const { id } = req.params
    const item = await OtModel.findById(id)
    console.log('updateOT id =', id)

    if (!item) {
      return res.status(404).json({ success: false, message: 'OT not found' })
    }

    res.json({ success: true, data: item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const createOt = async (req, res) => {
  try {
    const body = req.body;
    delete body.id;

    if (!body.start_time || !body.end_time || !body.emp_id) {
      return res.status(400).json({ success: false, message: 'Require start_time, end_time, emp_id' });
    }

    const typeId = body.type || 1;
    const allConfigs = await OtConfigModel.findAll();

    // ---------------------------------------------------------
    // 2. ดึงข้อมูลวันหยุด และแปลงเป็น Array ของ 'YYYY-MM-DD'
    // ---------------------------------------------------------
    const rawHolidays = await HolidayModel.findAll(); 
    const holidayList = rawHolidays.map(h => dayjs(h.day_date).format('YYYY-MM-DD'));
    
    // 3. ส่ง holidayList เข้าไปในฟังก์ชันคำนวณ
    let calculationResult;
    try {
        // เพิ่ม Parameter ตัวสุดท้ายเป็น holidayList
        calculationResult = OtModel.calculateOtDetails(
            body.start_time, 
            body.end_time, 
            typeId, 
            allConfigs, 
            holidayList // <--- ส่งไปตรงนี้
        );
    } catch (calcError) {
        return res.status(400).json({ success: false, message: calcError.message });
    }

    const { total, details } = calculationResult;

    // ... (Code ส่วนบันทึกข้อมูล request, createOt, detail เหมือนเดิม) ...
    
    const lastDoc = await OtModel.getLastRequestDocNo();
    const docNo = OtModel.generateNextDocNo(lastDoc);
    
    const requestPkId = await OtModel.createRequest({
        doc_no: docNo, title: 'ขออนุมัติทำโอที', type: typeId, sts: '1', created_by: body.emp_id
    });

    const otHeaderData = {
        ...body, request_id: requestPkId,
        start_time: dayjs(body.start_time).format('YYYY-MM-DD HH:mm:ss'),
        end_time: dayjs(body.end_time).format('YYYY-MM-DD HH:mm:ss'),
        total: total, created_by: body.emp_id
    };
    
    const createdOt = await OtModel.create(otHeaderData);
    const otId = createdOt.id;

    if (details.length > 0) {
        await OtDetailModel.createMany(otId, details);
    }

    res.status(201).json({
        success: true,
        data: { ...createdOt, total: total },
        details: details,
        doc_no: docNo,
        message: 'Created OT request successfully'
    });

  } catch (err) {
    console.error("Error creating OT:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export const updateOt = async (req, res) => {
  try {
    const { id } = req.params

  
    const body = req.body

    const exists = await OtModel.findById(id)
    if (!exists) {
      return res.status(404).json({ success: false, message: 'OT id not found' })
    }

    // Determine start and end times for calculation
    const startTime = body.start_time || exists.start_time
    const endTime = body.end_time || exists.end_time

    // Calculate total hours
    const total = calculateHours(startTime, endTime)

    // Prepare data for DB
    const dbData = {
      ...body,
      start_time: formatDateForMySQL(startTime),
      end_time: formatDateForMySQL(endTime),
      total
    }

    const ok = await OtModel.update(id, dbData)
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Update failed' })
    }

    const updated = await OtModel.findById(id)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const deleteOt = async (req, res) => {
  try {

    const { id } = req.params

    const exists = await OtModel.findById(id)
    if (!exists) {
      return res.status(404).json({ success: false, message: 'OT not found' })
    }

    const ok = await OtModel.remove(id)
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Delete failed' })
    }

    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
