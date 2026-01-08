import db from "../config/db.js";
import approvalModel from "../models/approval.model.js";
import OtModel from "../models/ot.model.js";

const approvalService = {
  async createApproval({ requestId, status, reason, actionBy }) {
    // ไม่ต้องมี Transaction ใน Node.js แล้ว เพราะ SP จัดการให้
    // เรียก Stored Procedure บรรทัดเดียวจบ
    const sql = `CALL ProcessApproval(?, ?, ?, ?)`;
    await db.query(sql, [requestId, actionBy, status, reason]);
    return true;
  }
};

export default approvalService;
