import OtConfigModel from "../models/otConfig.model.js";
import OtService from "../services/ot.service.js";
import { sendResponse } from "../utils/response.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAllOtConfigs = catchAsync(async (req, res) => {
  const otConfigs = await OtConfigModel.findAll();
  sendResponse(res, 200, otConfigs, "ดึงข้อมูลการตั้งค่า OT ทั้งหมดสำเร็จ");
});

export const getOtConfigById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const otConfig = await OtConfigModel.findById(id);

  if (!otConfig) {
    throw { statusCode: 404, message: "ไม่พบข้อมูล OT Config ที่ระบุ" };
  }

  sendResponse(res, 200, otConfig, "ค้นหาการตั้งค่า OT สำเร็จ");
});


// ================= CREATE =================

export const createOtConfig = catchAsync(async (req, res) => {
  const {
    name,
    employee_type_id,
    day_type,
    ot_period,
    rate,
    start_time,
    start_condition,
    description,
    break_minutes,
    min_continuous_hours
  } = req.body;

  if (!name || !employee_type_id || !day_type || !ot_period) {
    throw {
      statusCode: 400,
      message: 'กรุณาส่งข้อมูลให้ครบถ้วน'
    };
  }

  const newOtConfig = await OtConfigModel.create({
    name,
    employee_type_id,
    day_type,
    ot_period,

    // ✅ รับตรงจาก frontend

    start_time,

    start_condition: start_condition,

    rate: rate || 1.0,

    description,

    break_minutes: break_minutes || 0,

    min_continuous_hours:
      min_continuous_hours ||
      (day_type === 'WORKDAY' ? 2.0 : 4.0),

    require_break: break_minutes > 0 ? 1 : 0,

    is_active: 1
  });

  sendResponse(res, 201, newOtConfig, "สร้างการตั้งค่า OT สำเร็จ");
});

// ================= UPDATE =================

export const updateOtConfig = catchAsync(async (req, res) => {
  const { id } = req.params;

  const {
    name,
    employee_type_id,
    day_type,
    ot_period,
    rate,
    start_condition,
    start_time,
    description,
    break_minutes,
    min_continuous_hours,
    is_active
  } = req.body;

  // อัปเดต Config ตามปกติ
  await OtConfigModel.update(id, {
    name,
    employee_type_id,
    day_type,
    ot_period,
    rate,
    start_condition,
    start_time,
    description,
    break_minutes,
    min_continuous_hours,
    require_break: break_minutes > 0 ? 1 : 0,
    is_active: is_active !== undefined ? is_active : 1
  });

  await OtService.recalculateAllPending();

  sendResponse(res, 200, null, "อัปเดต OT Config และคำนวณยอดเงินรายการคงค้างใหม่เรียบร้อยแล้ว");
});


// ================= DELETE =================

export const deleteOtConfig = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleted = await OtConfigModel.remove(id);

  if (!deleted) {
    throw { statusCode: 404, message: "ไม่พบข้อมูล OT Config ที่ระบุ" };
  }

  sendResponse(res, 200, null, "ลบ OT Config สำเร็จ");
});
