import dayjs from "dayjs";
import OtModel from "../models/ot.model.js";
import OtDetailModel from "../models/otDetail.model.js";
import OtConfigModel from "../models/otConfig.model.js";
import HolidayModel from "../models/holiday.model.js";
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
  sendResponse(res, 200, data);
});

export const getRequest = catchAsync(async (req, res) => {
  const data = await OtModel.requestOt();
  sendResponse(res, 200, data);
});

export const getOtById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await OtModel.findById(id);
  if (!item) throw { statusCode: 404, message: "OT not found" };

  sendResponse(res, 200, item);
});

export const createOt = catchAsync(async (req, res) => {
  const body = req.body;
  delete body.id;

  if (!body.start_time || !body.end_time || !body.emp_id) {
    throw {
      statusCode: 400,
      message: "Require fields: start_time, end_time, emp_id",
    };
  }

  const typeId = body.type || 1;
  const statusToSave = body.sts ?? 1;

  // 1. Prepare Header Data
  const lastDoc = await OtModel.getLastRequestDocNo();
  const docNo = OtModel.generateNextDocNo(lastDoc);

  const requestPkId = await OtModel.createRequest({
    doc_no: docNo,
    title: body.description || "ขออนุมัติทำโอที",
    type: typeId,
    sts: statusToSave,
    created_by: body.emp_id,
  });

  const baseOtData = {
    ...body,
    request_id: requestPkId,
    start_time: dayjs(body.start_time).format("YYYY-MM-DD HH:mm:ss"),
    end_time: dayjs(body.end_time).format("YYYY-MM-DD HH:mm:ss"),
    created_by: body.emp_id,
  };

  // Case A: Draft
  if (statusToSave === 0) {
    const rawTotal = calculateHours(body.start_time, body.end_time);
    const createdOt = await OtModel.create({ ...baseOtData, total: rawTotal });
    return sendResponse(res, 201, createdOt, "Draft Saved");
  }

  // Case B: Submit
  // ✅ เรียกใช้ผ่าน Model โดยตรง
  const holidayList = await HolidayModel.getHolidayDateList();
  const allConfigs = await OtConfigModel.findAll();

  const { total, details } = OtModel.calculateOtDetails(
    body.start_time,
    body.end_time,
    typeId,
    allConfigs,
    holidayList
  );

  const createdOtResult = await OtModel.create({ ...baseOtData, total });
  if (details.length > 0) {
    await OtDetailModel.createMany(createdOtResult.id, details);
  }

  sendResponse(
    res,
    201,
    { ...createdOtResult, details },
    "Created OT Successfully"
  );
});

export const updateOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  const exists = await OtModel.findById(id);
  if (!exists) throw { statusCode: 404, message: "OT id not found" };

  const statusToSave = body.sts ?? exists.sts;
  const startTime = body.start_time || exists.start_time;
  const endTime = body.end_time || exists.end_time;
  const isTimeChanged = body.start_time || body.end_time;

  if (exists.request_id) {
    await OtModel.updateRequestStatus(exists.request_id, statusToSave);
  }

  // Case A: Draft / No Time Change
  if (statusToSave === 0 || !isTimeChanged) {
    let rawTotal = isTimeChanged
      ? calculateHours(startTime, endTime)
      : exists.total;

    const updated = await OtModel.update(id, {
      ...exists,
      start_time: dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
      end_time: dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
      description: body.description ?? exists.description,
      total: rawTotal,
    });

    // Return early เพื่อลด nesting
    const otData = await OtModel.findById(id);
    return sendResponse(res, 200, otData);
  }

  // Case B: Recalculate Logic
  // ✅ เรียกใช้ผ่าน Model โดยตรง
  const holidayList = await HolidayModel.getHolidayDateList();
  const allConfigs = await OtConfigModel.findAll();

  const { total, details } = OtModel.calculateOtDetails(
    startTime,
    endTime,
    body.type || exists.type || 1,
    allConfigs,
    holidayList
  );

  if (details.length > 0) await OtDetailModel.createMany(id, details);

  await OtModel.update(id, {
    ...exists,
    start_time: dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
    end_time: dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
    description: body.description ?? exists.description,
    total: total,
  });

  const otData = await OtModel.findById(id);
  const detailsData = await OtDetailModel.findByOtId(id);
  sendResponse(res, 200, { ot: otData, details: detailsData });
});

export const submitOtRequest = catchAsync(async (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0)
    throw { statusCode: 400, message: "No items selected" };

  const allConfigs = await OtConfigModel.findAll();
  const holidayList = await HolidayModel.getHolidayDateList();
  const processedRequestIds = new Set();

  // Parallel Processing (Optional: use Promise.all for better performance if items are many)
  for (const item of items) {
    const otData = await OtModel.findById(item.id);
    if (!otData) continue;

    const { total, details } = OtModel.calculateOtDetails(
      otData.start_time,
      otData.end_time,
      1, // default type
      allConfigs,
      holidayList
    );

    if (details.length > 0) await OtDetailModel.createMany(otData.id, details);

    await OtModel.update(otData.id, { ...otData, total });
    if (otData.request_id) processedRequestIds.add(otData.request_id);
  }

  // Update Request Statuses
  for (const reqId of processedRequestIds) {
    await OtModel.updateRequestStatus(reqId, "1");
  }

  sendResponse(res, 200, null, "Submitted successfully");
});

export const deleteOt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const exists = await OtModel.findById(id);
  if (!exists) throw { statusCode: 404, message: "OT not found" };

  await OtModel.remove(id);
  sendResponse(res, 200, null, "Deleted");
});
