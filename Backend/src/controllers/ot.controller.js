import dayjs from "dayjs";
import OtModel from "../models/ot.model.js";
import OtDetailModel from "../models/otDetail.model.js";
import OtConfigModel from "../models/otConfig.model.js";
import HolidayModel from "../models/holiday.model.js";
import OtService from "../services/ot.service.js";
import { catchAsync } from "../utils/catchAsync.js"; // Import ตัวที่สร้างใหม่
import { sendResponse } from "../utils/response.js"; //

// --- Helper Functions (Private) ---
const calculateHours = (start, end) => {
  const s = dayjs(start);
  const e = dayjs(end);
  const diffMinutes = e.diff(s, "minute");
  return diffMinutes > 0 ? parseFloat((diffMinutes / 60).toFixed(2)) : 0;
};

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

  // Validation เบื้องต้น
  if (!body.start_time || !body.end_time || !body.emp_id) {
    throw {
      statusCode: 400,
      message: "ข้อมูลไม่ครบถ้วน (start_time, end_time, emp_id)",
    };
  }

  // เตรียม Doc No
  const lastDoc = await OtModel.getLastRequestDocNo();
  const docNo = OtModel.generateNextDocNo(lastDoc);

  // ✅ เรียกใช้ Service แทน Logic เดิม
  // ส่ง leader_emp_id ไปด้วย (Frontend ต้องส่งมา หรือไป Query หาจาก emp_id)
  const result = await OtService.createOt({
    ...body,
    doc_no: docNo,
    // ถ้า Frontend ไม่ส่ง sts มา ให้ default เป็น 1 (Submit)
    sts: body.sts ?? 1,
  });

  sendResponse(res, 201, result, "บันทึก OT และสร้างรายการอนุมัติสำเร็จ");
});

export const updateOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  // ✅ เรียกใช้ Service Update
  const result = await OtService.updateOt(id, body);

  sendResponse(res, 200, result, "อัปเดตข้อมูลสำเร็จ");
});

export const submitOtRequest = catchAsync(async (req, res) => {
  // 1. รับค่าจาก Frontend
  const { items, leader_emp_id } = req.body;

  // 2. Validate
  if (!items || items.length === 0) {
    throw { statusCode: 400, message: "กรุณาเลือกรายการที่ต้องการส่งคำขอ" };
  }
  if (!leader_emp_id) {
    throw { statusCode: 400, message: "กรุณาระบุรหัสหัวหน้างาน (leader_emp_id)" };
  }

  // 3. เรียก Service ให้ทำงาน
  const result = await OtService.submitOtRequest(items, leader_emp_id);

  // 4. ส่ง Response กลับ
  sendResponse(res, 200, result, "ส่งคำขอและสร้างรายการอนุมัติสำเร็จ");
});

export const deleteOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const exists = await OtModel.findById(id);
  if (!exists) throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" };

  await OtModel.remove(id);
  sendResponse(res, 200, null, "ลบข้อมูลสำเร็จ");
});
