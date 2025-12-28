import employee from "../models/emp.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";

export const createEmp = catchAsync(async (req, res) => {
  const created = await employee.create(req.body);
  res.status(201).json({ success: true, data: created });
});

export const AllEmp = catchAsync(async (req, res) => {
  const data = await employee.findAll();
  res.status(201).json({ success: true, data: data });
});
