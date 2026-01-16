import OtConfigModel from "../models/otConfig.model.js";
import OtService from "../services/ot.service.js";
import { sendResponse } from "../utils/response.js";
import { catchAsync } from "../utils/catchAsync.js";

const prepareConfigData = (body) => {
  const isWorkDay = body.day_type === "WORKDAY";

  return {
    name: body.name,
    employee_type_id: body.employee_type_id,
    day_type: body.day_type,
    ot_period: body.ot_period,
    start_condition: body.start_condition,
    start_time: body.start_time,
    description: body.description,

    // Default Values Logic
    rate: body.rate ?? 1.0,
    break_minutes: body.break_minutes ?? 0,
    min_continuous_hours: body.min_continuous_hours ?? (isWorkDay ? 2.0 : 4.0),
    require_break: body.break_minutes > 0 ? 1 : 0,
    is_active: body.is_active ?? 1,
  };
};

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
  const { name, employee_type_id, day_type, ot_period } = req.body;

  // 1. Validation แบบ Guard Clause (อ่านง่ายกว่า)
  if (!name || !employee_type_id || !day_type || !ot_period) {
    throw {
      statusCode: 400,
      message: "กรุณาส่งข้อมูลให้ครบถ้วน (name, type, day, period)",
    };
  }

  // 2. Prepare Data
  const configData = prepareConfigData(req.body);

  // 3. Save
  const newOtConfig = await OtConfigModel.create(configData);
  sendResponse(res, 201, newOtConfig, "สร้างการตั้งค่า OT สำเร็จ");
});

// ================= UPDATE =================

export const updateOtConfig = catchAsync(async (req, res) => {
  const { id } = req.params;

  // 1. Prepare Data
  const configData = prepareConfigData(req.body);

  // 2. Update
  await OtConfigModel.update(id, configData);

  // 3. Trigger Calculation
  await OtService.recalculateAllPending();

  sendResponse(res, 200, null, "อัปเดตและคำนวณยอดเงินใหม่เรียบร้อยแล้ว");
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
