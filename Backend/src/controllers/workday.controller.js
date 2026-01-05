import WorkdayModel from '../models/workday.model.js';
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

export const getAllWorkdays = catchAsync(async (req, res) => {
    const workdays = await WorkdayModel.findAll();
    sendResponse(res, 200, workdays);
});

export const getWorkdayById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const workday = await WorkdayModel.findById(id);

    if (!workday) {
        throw { statusCode: 404, message: "ไม่พบข้อมูล Workday ที่ระบุ" };
    }

    sendResponse(res, 200, workday);
});

export const createWorkday = catchAsync(async (req, res) => {
    const { name, work_day, work_hour, start_time, end_time } = req.body;
    
    if (!name || !work_day || !start_time || !end_time) {
        throw { statusCode: 400, message: "ข้อมูลไม่ครบถ้วน (name, work_day, start_time, end_time)" };
    }

    const newWorkday = await WorkdayModel.create({ name, work_day, work_hour, start_time, end_time });
    sendResponse(res, 201, newWorkday, "สร้าง Workday สำเร็จ");
});

export const updateWorkday = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, work_day, work_hour, start_time, end_time } = req.body;
    
    const updated = await WorkdayModel.update(id, { name, work_day, work_hour, start_time, end_time });
    if (!updated) {
        throw { statusCode: 404, message: "ไม่พบข้อมูล Workday ที่ระบุหรือไม่มีการเปลี่ยนแปลง" };
    }

    sendResponse(res, 200, null, "อัปเดต Workday สำเร็จ");
});

export const deleteWorkday = catchAsync(async (req, res) => {
    const { id } = req.params;
    const deleted = await WorkdayModel.remove(id);

    if (!deleted) {
        throw { statusCode: 404, message: "ไม่พบข้อมูล Workday ที่ระบุ" };
    }

    sendResponse(res, 200, null, "ลบ Workday สำเร็จ");
});