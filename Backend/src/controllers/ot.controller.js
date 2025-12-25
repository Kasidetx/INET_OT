// src/controllers/ot.controller.js
import OtModel from "../models/ot.model.js";
import OtDetailModel from "../models/otDetail.model.js";
import OtConfigModel from "../models/otConfig.model.js";
import HolidayModel from "../models/holiday.model.js";
import dayjs from "dayjs";

const formatDateForMySQL = (dateObj) =>
  dayjs(dateObj).format("YYYY-MM-DD HH:mm:ss");

const calculateHours = (start, end) => {
  const s = dayjs(start);
  const e = dayjs(end);
  const diffMinutes = e.diff(s, "minute");
  return diffMinutes > 0 ? parseFloat((diffMinutes / 60).toFixed(2)) : 0;
};

export const getAllEmployee = async (req, res) => {
  try {
    // รับค่า ?emp_id=xxx จาก URL
    const { emp_id } = req.query;

    // ส่งให้ Model (Model จะตัดสินใจเองว่าถ้าเป็น null คือดึงทั้งหมด)
    const data = await OtModel.AllEmployee(emp_id);

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error getAllEmployee:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRequest = async (req, res) => {
  try {
    const data = await OtModel.requestOt();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error getRequest" });
  }
};

export const getOtById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await OtModel.findById(id);
    console.log("updateOT id =", id);

    if (!item) {
      return res.status(404).json({ success: false, message: "OT not found" });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createOt = async (req, res) => {
  try {
    const body = req.body;
    delete body.id;

    if (!body.start_time || !body.end_time || !body.emp_id) {
      return res
        .status(400)
        .json({ success: false, message: "Require fields" });
    }

    const typeId = body.type || 1;
    // รับค่า sts จากหน้าบ้าน (0=Draft/รูดบัตร, 1=Submit/เพิ่มเอง)
    const statusToSave = body.sts !== undefined ? body.sts : 1;

    // สร้างเลข Doc No
    const lastDoc = await OtModel.getLastRequestDocNo();
    const docNo = OtModel.generateNextDocNo(lastDoc);

    // สร้าง Request Header
    const requestPkId = await OtModel.createRequest({
      doc_no: docNo,
      title: body.description || "ขออนุมัติทำโอที",
      type: typeId,
      sts: statusToSave,
      created_by: body.emp_id,
    });

    // =========================================================
    // กรณีที่ 1: จำลองรูดบัตร (sts = 0) -> บันทึกแบบ Draft (เร็ว, ไม่คำนวณละเอียด)
    // =========================================================
    if (statusToSave === 0) {
      // คำนวณชั่วโมงดิบๆ ไว้โชว์เบื้องต้น
      const rawTotal = calculateHours(body.start_time, body.end_time);

      const otHeaderData = {
        ...body,
        request_id: requestPkId,
        start_time: dayjs(body.start_time).format("YYYY-MM-DD HH:mm:ss"),
        end_time: dayjs(body.end_time).format("YYYY-MM-DD HH:mm:ss"),
        total: rawTotal,
        created_by: body.emp_id,
      };

      const createdOt = await OtModel.create(otHeaderData);

      return res.status(201).json({
        success: true,
        data: createdOt,
        message: "Simulate Swipe (Draft) Saved",
      });
    }

    // =========================================================
    // กรณีที่ 2: เพิ่มเอง (sts = 1) -> คำนวณ + สร้าง Detail เลย (One-stop)
    // =========================================================
    else {
      // 1. เตรียม Config
      const allConfigs = await OtConfigModel.findAll();
      const rawHolidays = await HolidayModel.findAll();
      const holidayList = rawHolidays.map((h) =>
        dayjs(h.day_date).format("YYYY-MM-DD")
      );

      // 2. คำนวณยอดจริง
      let calculationResult;
      try {
        calculationResult = OtModel.calculateOtDetails(
          body.start_time,
          body.end_time,
          typeId,
          allConfigs,
          holidayList
        );
      } catch (calcError) {
        return res
          .status(400)
          .json({ success: false, message: calcError.message });
      }

      const { total, details } = calculationResult;

      // 3. สร้าง OT Header ด้วยยอดที่คำนวณได้
      const otHeaderData = {
        ...body,
        request_id: requestPkId,
        start_time: dayjs(body.start_time).format("YYYY-MM-DD HH:mm:ss"),
        end_time: dayjs(body.end_time).format("YYYY-MM-DD HH:mm:ss"),
        total: total,
        created_by: body.emp_id,
      };

      const createdOtResult = await OtModel.create(otHeaderData);
      const newOtId = createdOtResult.id;

      // 4. สร้าง Details ลงตาราง
      if (details.length > 0) {
        await OtDetailModel.createMany(newOtId, details);
      }

      return res.status(201).json({
        success: true,
        data: { ...createdOtResult, details },
        message: "Created OT Request and Details successfully",
      });
    }
  } catch (err) {
    console.error("Error creating OT:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateOt = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // 1. เช็คว่ามี OT นี้อยู่จริงไหม
    const exists = await OtModel.findById(id);
    if (!exists) {
      return res.status(404).json({ success: false, message: "OT id not found" });
    }

    // 2. เตรียมค่าที่จะบันทึก
    const statusToSave = body.sts !== undefined ? body.sts : exists.sts;
    const startTime = body.start_time || exists.start_time;
    const endTime = body.end_time || exists.end_time;
    const typeId = body.type || exists.type || 1;
    const description = body.description !== undefined ? body.description : exists.description;

    // ✅ FIX 1: อัปเดตสถานะที่ตาราง request (ถ้ามี request_id)
    if (exists.request_id) {
        await OtModel.updateRequestStatus(exists.request_id, statusToSave);
    }

    // เช็คว่ามีการแก้เวลาไหม?
    const isTimeChanged = (body.start_time || body.end_time);

    // =========================================================
    // กรณีที่ 1: เป็น Draft (sts = 0) หรือไม่ได้แก้เวลา
    // =========================================================
    // ตาม Logic คุณ: Draft ไม่ต้องยุ่งกับ Detail, Update แค่ Header พอ
    if (statusToSave === 0 || !isTimeChanged) {
        let rawTotal = exists.total;

        // ถ้าเวลาเปลี่ยน ให้คำนวณยอดรวมใหม่แบบคร่าวๆ (ไม่ต้องลง Detail)
        if (isTimeChanged) {
            rawTotal = calculateHours(startTime, endTime);
        }

        const dbData = {
            ...exists,
            start_time: dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
            end_time: dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
            description: description,
            total: rawTotal,
            // ไม่ต้องส่ง sts ไป update ที่ ot เพราะ ot ไม่มี field sts (มันอยู่ที่ request)
        };
        
        await OtModel.update(id, dbData);
    }
    // =========================================================
    // กรณีที่ 2: เป็น Manual/Submit (sts = 1) และมีการแก้เวลา
    // =========================================================
    // ตาม Logic คุณ: ต้องคำนวณ Detail ใหม่ และ สร้างลง DB เลย
    else {
        // 1. เตรียม Config มาคำนวณ
        const allConfigs = await OtConfigModel.findAll();
        const rawHolidays = await HolidayModel.findAll();
        const holidayList = rawHolidays.map((h) => dayjs(h.day_date).format("YYYY-MM-DD"));

        // 2. คำนวณยอด
        let calculationResult;
        try {
            calculationResult = OtModel.calculateOtDetails(
                dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
                dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
                typeId,
                allConfigs,
                holidayList
            );
        } catch (calcError) {
            return res.status(400).json({ success: false, message: calcError.message });
        }

        const { total, details } = calculationResult;

        // ✅ FIX 2: ลบ Detail เก่าทิ้งก่อน (ป้องกันข้อมูลเบิ้ล)
        await OtDetailModel.deleteByOtId(id);

        // 3. สร้าง Detail ใหม่
        if (details.length > 0) {
            await OtDetailModel.createMany(id, details);
        }

        // 4. อัปเดต Header
        const dbData = {
            ...exists,
            start_time: dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
            end_time: dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
            description: description,
            total: total,
        };
        await OtModel.update(id, dbData);
    }

    // ส่งผลลัพธ์กลับ
    const updated = await OtModel.findById(id);
    const updatedDetails = await OtDetailModel.findByOtId(id);
    res.json({ success: true, data: updated, details: updatedDetails });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const submitOtRequest = async (req, res) => {
  try {
    // รับเป็น Array ของ ot_id ที่ถูกเลือก (หรือจะรับเป็น request_id ก็ได้ตาม design)
    // สมมติรับเป็น { items: [ { id: 10, emp_id: '...' }, ... ] }
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items selected" });
    }

    // เตรียม Config และ Holiday ครั้งเดียวเพื่อใช้คำนวณ
    const allConfigs = await OtConfigModel.findAll();
    const rawHolidays = await HolidayModel.findAll();
    const holidayList = rawHolidays.map((h) =>
      dayjs(h.day_date).format("YYYY-MM-DD")
    );

    const processedRequestIds = new Set();

    // วนลูปรายการที่ User เลือกเพื่อคำนวณและสร้าง Detail
    for (const item of items) {
      // ดึงข้อมูล OT ล่าสุด
      const otData = await OtModel.findById(item.id);
      if (!otData) continue;

      // 1. คำนวณ Detail จริงๆ ตรงนี้ (Business Logic)
      const calculationResult = OtModel.calculateOtDetails(
        otData.start_time,
        otData.end_time,
        1, // typeId (ควรดึงจาก request หรือ ot ถ้ามีการเก็บไว้)
        allConfigs,
        holidayList
      );

      const { total, details } = calculationResult;

      // 2. ลบ Detail เก่าทิ้งก่อน (กันเหนียว)
      // await OtDetailModel.deleteByOtId(otData.id); // *ต้องเพิ่มฟังก์ชันนี้ใน Model ถ้ายังไม่มี

      // 3. สร้าง Detail ใหม่
      if (details.length > 0) {
        await OtDetailModel.createMany(otData.id, details);
      }

      // 4. อัปเดตยอดรวมที่แท้จริงกลับไปที่ OT
      await OtModel.update(otData.id, { ...otData, total: total });

      // เก็บ request_id ไว้เพื่อไปอัปเดตสถานะ
      if (otData.request_id) {
        processedRequestIds.add(otData.request_id);
      }
    }

    // 5. เปลี่ยนสถานะ Request จาก 0 (Draft) -> 1 (Pending Head)
    for (const reqId of processedRequestIds) {
      console.log("👉 Updating Request ID:", reqId, " to status 1");
      await OtModel.updateRequestStatus(reqId, "1");
    }

    res.json({ success: true, message: "Submitted successfully" });
  } catch (err) {
    console.error("Error submitting OT:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteOt = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await OtModel.findById(id);
    if (!exists) {
      return res.status(404).json({ success: false, message: "OT not found" });
    }

    const ok = await OtModel.remove(id);
    if (!ok) {
      return res.status(500).json({ success: false, message: "Delete failed" });
    }

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
