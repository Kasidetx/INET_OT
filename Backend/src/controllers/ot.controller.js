// src/controllers/ot.controller.js
import OtModel from '../models/ot.model.js'

const generateNextDocNo = (lastDocNo) => {
    // 1. ถ้ายังไม่มีเอกสารใดๆ เลยในระบบ ให้เริ่มที่ OT-1
    if (!lastDocNo) return 'OT-1';
    
    // 2. แยกส่วน 'OT' กับ 'ตัวเลข' (สมมติ format คือ OT-123)
    const parts = lastDocNo.split('-'); 
    // parts[0] = 'OT', parts[1] = '1'

    if (parts.length < 2) return 'OT-1'; // กันเหนียว
    
    // 3. แปลงเป็นตัวเลขแล้วบวก 1
    const numberPart = parseInt(parts[1], 10);
    
    if (isNaN(numberPart)) return 'OT-1'; // ถ้าแปลงไม่ได้ ให้เริ่มใหม่
    
    const nextNumber = numberPart + 1;
    
    // 4. ส่งคืนค่ารูปแบบ OT-X
    return `OT-${nextNumber}`;
};

export const getAllEmployee = async (req, res) => {
  try {
    const data = await OtModel.AllEmployee()
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error getAllEmployee' })
  }
}

export const getRequest = async (req, res) => {
  try {
    // 1. ดึงค่า emp_id ที่ส่งมาจาก Frontend (เช่น ?emp_id=61301)
    const { emp_id } = req.query; 

    // 2. ส่งต่อให้ Model
    const data = await OtModel.requestOt(emp_id);
    
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error getRequest' });
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

const calculateOtHours = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime - startTime;
  
  // 1. หาชั่วโมงรวมทั้งหมดที่เขาอยู่ในบริษัท (Total Presence)
  let totalPresence = diffMs / (1000 * 60 * 60);

  // 2. หักเวลาทำงานปกติออก (9 ชม. รวมพัก) เพื่อให้เหลือแต่ "ชั่วโมงโอทีดิบ"
  // ถ้าทำไม่ถึง 9 ชม. แสดงว่าไม่มีโอที ให้เป็น 0
  let otHours = totalPresence >= 9 ? totalPresence - 9 : 0;

  // 3. เงื่อนไขหักพักโอที: ถ้าโอทีดิบ (เศษที่เกินมา) ครบหรือเกิน 2 ชม. ให้หักออกอีก 30 นาที (0.5 ชม.)
  if (otHours >= 2) {
    otHours = otHours - 0.5;
  }

  // ปัดเศษทศนิยม 2 ตำแหน่ง
  return Math.round(otHours * 100) / 100;
}

const formatDateForMySQL = (isoDate) => {
  if (!isoDate) return null
  const d = new Date(isoDate)
  // Format to YYYY-MM-DD HH:MM:SS
  // Note: toISOString() returns UTC. If we want to preserve the input time as is (assuming it's already correct), 
  // we might need to be careful. But usually stripping T and Z from ISO string is enough if it's UTC.
  // However, to be safe and simple:
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export const createOt = async (req, res) => {
  try {
    const body = req.body

    // Validation ...
    if (!body.start_time || !body.end_time || !body.emp_id) {
      return res.status(400).json({ success: false, message: 'Require data' })
    }
    
    const total = calculateOtHours(body.start_time, body.end_time)

    // ----------------------------------------------------
    // START: Logic Grouping & Running Number
    // ----------------------------------------------------
    let docNo;
    
    // 1. ลองหาใบเดิมที่ยัง Active ของพนักงานคนนี้ก่อน
    const activeRequest = await OtModel.findActiveRequest(body.emp_id);
    
    if (activeRequest) {
        // ✅ กรณี A: มีใบเดิมที่ยังไม่จบ -> ใช้เลขเดิม (เช่น OT-1)
        docNo = activeRequest.doc_no;
        console.log(`[OT] Found active request, Using: ${docNo}`);
    } else {
        // ✅ กรณี B: ไม่มีใบเดิม -> สร้างใบใหม่ -> รันเลขต่อจากล่าสุดในระบบ
        
        // ดึงเลขล่าสุดจาก Database (ดูว่าล่าสุดเป็น OT อะไร เช่น OT-5)
        const lastDoc = await OtModel.getLastRequestDocNo();
        
        // Gen เลขใหม่ (จะได้ OT-6)
        docNo = generateNextDocNo(lastDoc);
        
        const typeId = body.type || 1; // Default type=1 (NORMAL) ถ้า frontend ไม่ส่งมา

        // สร้าง Header Request ใหม่
        await OtModel.createRequest({
            doc_no: docNo,
            title: 'ขออนุมัติทำโอที',
            type: typeId,
            sts: '1', // Active
            created_by: body.emp_id
        });
        console.log(`[OT] Created NEW request: ${docNo}`);
    }
    // ----------------------------------------------------

    const dbData = {
      ...body,
      request_id: docNo, // ใส่เลขที่ได้มา (OT-1 หรือ OT-2...)
      start_time: formatDateForMySQL(body.start_time),
      end_time: formatDateForMySQL(body.end_time),
      total,
      created_by: body.emp_id
    }

    const created = await OtModel.create(dbData)
    
    res.status(201).json({ 
        success: true, 
        data: created,
        doc_no: docNo, // ส่งเลขเอกสารกลับไปให้ Frontend ดูด้วย
        message: activeRequest ? 'Added to existing request' : 'Created new request'
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
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
