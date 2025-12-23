import employee from "../models/emp.model.js";

export const createEmp = async (req, res) => {
  try {
    const created = await employee.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error - createEmp" });
  }
};

export const AllEmp = async (req, res) => {
  try {
    const data = await employee.findAll();
    res.status(201).json({ success: true, data: data });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error - AllEmp" });
  }
}
