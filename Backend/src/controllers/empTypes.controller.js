import empTypes from "../models/empTypes.model.js";
import { catchAsync } from "../utils/catchAsync.js"; // ✅ Import
import { sendResponse } from "../utils/response.js"; // ✅ Import

export const getAllEmpType = catchAsync(async (req, res) => {
    const data = await empTypes.findAll();
    sendResponse(res, 200, data);
});

export const createTypes = catchAsync(async (req, res) => {
    const created = await empTypes.create(req.body);
    sendResponse(res, 201, created);
});