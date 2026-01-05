import OtDetailModel from "../models/otDetail.model.js";
import OtModel from "../models/ot.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

export const getAllDetails = catchAsync(async (req, res) => {
  const details = await OtDetailModel.findAll();
  sendResponse(res, 200, details);
});

export const getDetailsByOtId = catchAsync(async (req, res) => {
  const { id } = req.params;
  const header = await OtModel.findById(id);

  if (!header) {
    throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" }; // ✅ Throw Error ให้ Global Handler จับ
  }

  const details = await OtDetailModel.findByOtId(id);
  sendResponse(res, 200, { ot: header, details }, "ดึงรายละเอียด OT สำเร็จ");
});

export const createDetailsForOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const details = req.body.details;

  if (!Array.isArray(details) || details.length === 0) {
    throw { statusCode: 400, message: "details ต้องเป็น array" };
  }

  const header = await OtModel.findById(id);
  if (!header) {
    throw { statusCode: 404, message: "ไม่พบข้อมูล OT ที่ระบุ" };
  }

  await OtDetailModel.createMany(id, details);

  // Recalculate Total logic...
  const allDetails = await OtDetailModel.findByOtId(id);
  const totalHour = allDetails.reduce((sum, d) => sum + (d.ot_hour || 0), 0);

  await OtModel.update(id, { ...header, total: totalHour });

  sendResponse(
    res,
    201,
    {
      ot_id: id,
      total_hour: totalHour,
      details: allDetails,
    },
    "สร้างรายละเอียด OT สำเร็จ"
  );
});
