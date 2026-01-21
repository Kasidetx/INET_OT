import db from "../config/db.js";
import approvalModel from "../models/approval.model.js";
import OtModel from "../models/ot.model.js";
import { OT_STATUS } from "../config/constants.js";

const approvalService = {
  async createApproval({ requestId, status, reason, actionBy }) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. หาว่าตอนนี้รายการนี้ค้างอยู่ที่ Level ไหน
      const current = await approvalModel.findCurrentLevel(requestId);

      if (!current) {
        throw new Error(
          "ไม่พบรายการที่รออนุมัติ หรือรายการนี้ถูกดำเนินการไปแล้ว",
        );
      }

      const currentLevel = current.level;
      let newApprovalRowStatus = OT_STATUS.PENDING_HEAD; // Default 1
      let newRequestHeaderStatus = OT_STATUS.PENDING_HEAD; // Default 1

      // =======================================================
      // 🎯 LOGIC ใหม่: ใช้ Constant แทนเลข 1, 2, 3
      // =======================================================

      if (status === "approve") {
        // --- กรณีอนุมัติ ---
        newApprovalRowStatus = OT_STATUS.APPROVED; // 3: คนนี้กดอนุมัติแล้ว

        if (currentLevel === 1) {
          // Level 1 (Head) อนุมัติ -> ส่งต่อให้ HR (สถานะ 2)
          newRequestHeaderStatus = OT_STATUS.PENDING_HR;
        } else {
          // Level 2 (HR) อนุมัติ -> จบงาน (สถานะ 3)
          newRequestHeaderStatus = OT_STATUS.APPROVED;
        }
      } else if (status === "reject") {
        // --- กรณีไม่อนุมัติ ---
        if (currentLevel === 1) {
          // Head Reject -> สถานะ 4
          newApprovalRowStatus = OT_STATUS.REJECT_HEAD;
          newRequestHeaderStatus = OT_STATUS.REJECT_HEAD;
        } else {
          // HR Reject -> สถานะ 5
          newApprovalRowStatus = OT_STATUS.REJECT_HR;
          newRequestHeaderStatus = OT_STATUS.REJECT_HR;
        }
      }

      // 2. อัปเดตตาราง Approval
      await approvalModel.updateStatus(
        current.id,
        {
          approval_status: newApprovalRowStatus,
          reason: reason,
          action_by: actionBy,
        },
        conn,
      );

      // 3. อัปเดตสถานะรวมในตาราง Request Header
      const headerReason = status === "reject" ? reason : undefined;

      await OtModel.updateRequestStatus(
        requestId,
        newRequestHeaderStatus,
        conn,
        headerReason,
      );

      await conn.commit();
      return { success: true, status: newRequestHeaderStatus };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

export default approvalService;
