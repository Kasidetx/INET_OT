// src/controllers/ot.controller.js
import OtModel from '../models/ot.model.js'




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

    // เช็คค่าที่จำเป็น
    if (!body.start_time || !body.end_time) {
      return res.status(400).json({
        success: false,
        message: 'start_time AND end_time'
      })
    }
    
    // Calculate total hours
    const total = calculateOtHours(body.start_time, body.end_time)

    // Prepare data for DB
    const dbData = {
      ...body,
      start_time: formatDateForMySQL(body.start_time),
      end_time: formatDateForMySQL(body.end_time),
      total
    }

    const created = await OtModel.create(dbData)
    console.log('Created OT:', created)
    res.status(201).json({ success: true, data: created })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error - createOT' })
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
