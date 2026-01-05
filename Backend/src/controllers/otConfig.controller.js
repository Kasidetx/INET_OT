import OtConfigModel from "../models/otConfig.model.js";
import { sendResponse } from "../utils/response.js";
import { catchAsync } from "../utils/catchAsync.js"; // ✅ Import เพิ่ม

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

export const createOtConfig = catchAsync(async (req, res) => {
  const {
    description,
    type_work_id,
    start_time,
    end_time,
    rate,
    hour,
    deduction_min,
    is_active,
  } = req.body;

  if (!description || !type_work_id || !start_time || !end_time) {
    throw {
      statusCode: 400,
      message:
        "ข้อมูลไม่ครบถ้วน (description, type_work_id, start_time, end_time)",
    };
  }

  const newOtConfig = await OtConfigModel.create({
    description,
    type_work_id,
    start_time,
    end_time,
    rate,
    hour,
    deduction_min,
    is_active,
  });

  sendResponse(res, 201, newOtConfig, "สร้าง OT Config สำเร็จ");
});

export const updateOtConfig = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    description,
    type_work_id,
    start_time,
    end_time,
    rate,
    hour,
    deduction_min,
    is_active,
  } = req.body;

  const updated = await OtConfigModel.update(id, {
    description,
    type_work_id,
    start_time,
    end_time,
    rate,
    hour,
    deduction_min,
    is_active,
  });

  if (!updated) {
    throw { statusCode: 404, message: "ไม่พบข้อมูล OT Config ที่ระบุ" };
  }

  sendResponse(res, 200, null, "อัปเดต OT Config สำเร็จ");
});

export const deleteOtConfig = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleted = await OtConfigModel.remove(id);

  if (!deleted) {
    throw { statusCode: 404, message: "ไม่พบข้อมูล OT Config ที่ระบุ" };
  }

  sendResponse(res, 200, null, "ลบ OT Config สำเร็จ");
});
