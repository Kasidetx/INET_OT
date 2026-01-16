import OtService from "../services/ot.service.js";
import OtModel from "../models/ot.model.js"; // ใช้เฉพาะตอน GET/Query
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

// --- Controllers ---

export const getAllEmployee = catchAsync(async (req, res) => {
  const { emp_id } = req.query;
  const data = await OtModel.AllEmployee(emp_id);
  sendResponse(res, 200, data, "ค้นหาข้อมูล OT สำเร็จ");
});

export const getRequest = catchAsync(async (req, res) => {
  const { emp_id } = req.query;
  
  // ✅ เปลี่ยนมาใช้ฟังก์ชันที่ดึงจาก View
  const data = await OtModel.requestOt(emp_id);
  
  sendResponse(res, 200, data, "ดึงรายการคำขอ OT พร้อมรายละเอียดสำเร็จ");
});

export const getOtById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await OtModel.findById(id);
  if (!item) throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" };

  sendResponse(res, 200, item, "ดึงรายละเอียด OT สำเร็จ");
});

export const createOt = catchAsync(async (req, res) => {
  const { start_time, end_time, emp_id, sts, ...rest } = req.body;

  if (!start_time || !end_time || !emp_id) {
    throw {
      statusCode: 400,
      message: "ข้อมูลไม่ครบถ้วน (start_time, end_time, emp_id)",
    };
  }

  const result = await OtService.createOt({
    start_time,
    end_time,
    emp_id,
    sts: sts ?? 1, // Default status = 1 (Submit)
    ...rest,
  });

  sendResponse(res, 201, result, "บันทึก OT สำเร็จ");
});

export const updateOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OtService.updateOt(id, req.body);
  sendResponse(res, 200, result, "อัปเดตข้อมูลสำเร็จ");
});

export const submitOtRequest = catchAsync(async (req, res) => {
  const { items, leader_emp_id } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw {
      statusCode: 400,
      message: "กรุณาเลือกรายการ OT อย่างน้อย 1 รายการ",
    };
  }
  if (!leader_emp_id) {
    throw {
      statusCode: 400,
      message: "กรุณาระบุรหัสหัวหน้างาน (leader_emp_id)",
    };
  }

  const result = await OtService.submitOtRequest(items, leader_emp_id);
  sendResponse(res, 200, result, "ส่งคำขออนุมัติสำเร็จ");
});

export const deleteOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const exists = await OtModel.findById(id);
  if (!exists) throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" };

  await OtModel.remove(id);
  sendResponse(res, 200, null, "ลบข้อมูลสำเร็จ");
});
