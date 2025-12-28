import empTypes from "../models/empTypes.model.js";

export const getAllEmpType = async (req, res) => {
    try {
        const data = await empTypes.findAll()
        sendResponse(res, 200, data);
    }  catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Internal server error getAllEmployee' })
    }
}

export const createTypes = async (req, res) => {
  try {
    const created = await empTypes.create(req.body);
    sendResponse(res, 201, created);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error - createTypes" });
  }
};

