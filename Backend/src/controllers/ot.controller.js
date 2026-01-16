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
  const data = await OtModel.requestOt(emp_id);
  sendResponse(res, 200, data, "ดึงรายการคำขอ OT สำเร็จ");
});

export const getOtById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await OtModel.findById(id);
  if (!item) throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" };

  sendResponse(res, 200, item, "ดึงรายละเอียด OT สำเร็จ");
});

export const createOt = catchAsync(async (req, res) => {
  const body = req.body;

  // Basic Validation
  if (!body.start_time || !body.end_time || !body.emp_id) {
    throw {
      statusCode: 400,
      message: "ข้อมูลไม่ครบถ้วน (start_time, end_time, emp_id)",
    };
  }

  // เรียก Service
  const result = await OtService.createOt({
    ...body,
    sts: body.sts ?? 1,
  });

  sendResponse(res, 201, result, "บันทึก OT สำเร็จ");
});

export const updateOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OtService.updateOt(id, req.body);
  sendResponse(res, 200, result, "อัปเดตข้อมูลสำเร็จ");
});

export const submitOtRequest = catchAsync(async (req, res) => {
  // Controller นี้ดูดีแล้ว รับค่า -> เรียก Service -> ตอบกลับ
  const { items, leader_emp_id } = req.body;

  if (!items || items.length === 0)
    throw { statusCode: 400, message: "กรุณาเลือกรายการ" };
  if (!leader_emp_id) throw { statusCode: 400, message: "กรุณาระบุหัวหน้างาน" };

  const result = await OtService.submitOtRequest(items, leader_emp_id);
  sendResponse(res, 200, result, "ส่งคำขอสำเร็จ");
});

export const deleteOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const exists = await OtModel.findById(id);
  if (!exists) throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" };

  await OtModel.remove(id);
  sendResponse(res, 200, null, "ลบข้อมูลสำเร็จ");
});
