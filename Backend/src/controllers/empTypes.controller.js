import empTypes from "../models/empTypes.model.js";

export const getAllEmpType = async (req, res) => {
    try {
        const data = await empTypes.findAll()
        res.json({ success: true, data})
    }  catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Internal server error getAllEmployee' })
    }
}

export const createTypes = async (req, res) => {
  try {
    const created = await empTypes.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error - createTypes" });
  }
};

