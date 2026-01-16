import db from "../config/db.js";
import approvalModel from "../models/approval.model.js";
import OtModel from "../models/ot.model.js";

const approvalService = {
  async createApproval({ requestId, status, reason, actionBy }) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. หาว่าตอนนี้รายการนี้ค้างอยู่ที่ Level ไหน (Level 1=Head, 2=HR)
      const current = await approvalModel.findCurrentLevel(requestId);

      if (!current) {
        throw new Error(
          "ไม่พบรายการที่รออนุมัติ หรือรายการนี้ถูกดำเนินการไปแล้ว"
        );
      }

      const currentLevel = current.level;
      let newApprovalRowStatus = 1; // Status ของคนเซ็น (ในตาราง approval)
      let newRequestHeaderStatus = 1; // Status รวมของเอกสาร (ในตาราง request)

      // =======================================================
      // 🎯 LOGIC การแปลง Status (String -> Int)
      // =======================================================

      if (status === "approve") {
        // --- กรณีอนุมัติ ---
        newApprovalRowStatus = 3; // 3 = อนุมัติ (ของคนนั้นๆ)

        if (currentLevel === 1) {
          // ถ้าเป็นหัวหน้า (Level 1) อนุมัติ -> ส่งต่อให้ HR (Status 2)
          newRequestHeaderStatus = 2;
        } else {
          // ถ้าเป็น HR (Level 2) อนุมัติ -> จบงาน อนุมัติสมบูรณ์ (Status 3)
          newRequestHeaderStatus = 3;
        }
      } else if (status === "reject") {
        // --- กรณีไม่อนุมัติ ---

        if (currentLevel === 1) {
          // หัวหน้าไม่อนุมัติ -> Status 4
          newApprovalRowStatus = 4;
          newRequestHeaderStatus = 4;
        } else {
          // HR ไม่อนุมัติ -> Status 5
          newApprovalRowStatus = 5;
          newRequestHeaderStatus = 5;
        }
      }

      // =======================================================
      // 💾 บันทึกลง Database
      // =======================================================

      // 2. อัปเดตสถานะในตาราง Approval (เฉพาะแถวของคนที่กด)
      await approvalModel.updateStatus(
        current.id,
        {
          approval_status: newApprovalRowStatus,
          reason: reason,
          action_by: actionBy,
        },
        conn
      );

      // 3. อัปเดตสถานะรวมในตาราง Request Header
      // (ถ้า Reject ให้บันทึกเหตุผลลง Header ด้วยเพื่อให้เห็นชัดเจนที่หน้าแรก)
      const headerReason = status === "reject" ? reason : undefined;

      await OtModel.updateRequestStatus(
        requestId,
        newRequestHeaderStatus,
        conn,
        headerReason
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
