import employee from "../models/emp.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

export const createEmp = catchAsync(async (req, res) => {
  const created = await employee.create(req.body);

  sendResponse(res, 201, created);
});

export const AllEmp = catchAsync(async (req, res) => {
  const data = await employee.findAll();

  sendResponse(res, 200, data);
});