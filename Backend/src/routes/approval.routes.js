import express from "express";
import approvalController from "../controllers/approval.controller.js";

const router = express.Router();

// ดู approval ทั้ง flow
router.get("/request/:requestId", approvalController.getByRequest);

// approve / reject
// approve / reject (create new approval log)
router.post("/:requestId", approvalController.approve);

export default router;
