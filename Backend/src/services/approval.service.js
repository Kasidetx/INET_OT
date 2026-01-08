import db from "../config/db.js";
import approvalModel from "../models/approval.model.js";
import OtModel from "../models/ot.model.js";

const approvalService = {
  async createApproval({ requestId, status, reason, actionBy }) {
    // ✅ 2. สร้าง Connection และเริ่ม Transaction
    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();

      // 1. Get Request & Existing Approvals
      // ใช้ Model อ่านข้อมูล (Read) ไม่ต้องใช้ conn ก็ได้
      const request = await OtModel.findRequestById(requestId);
      if (!request) throw new Error("Request not found");

      const existingApprovals = await approvalModel.findByRequestId(requestId);

      // Determine Level (Logic เดิมของคุณ)
      let level = 0;
      if (actionBy.startsWith("head")) level = 1;
      else if (actionBy.startsWith("hr")) level = 2;

      if (level === 0) {
        const hasHead = existingApprovals.some(
          (a) => a.level == 1 && a.approval_status === "APPROVE"
        );
        level = hasHead ? 2 : 1;
      }

      // 2. Update or Insert Approval Log
      const targetApproval = existingApprovals.find(
        (a) => a.level === level && a.approval_status === "PENDING"
      );

      if (targetApproval) {
        // ✅ ส่ง conn ไปด้วย
        await approvalModel.updateStatus(
          targetApproval.id,
          {
            approval_status: status.toUpperCase(),
            reason,
            action_by: actionBy,
          },
          conn 
        );
      } else {
        // ✅ แก้ให้ส่ง conn ไปด้วย
        await approvalModel.addApprovalLog({
          request_id: requestId,
          level,
          approve_emp: actionBy, // หรือ targetApproval?.approve_emp ถ้ามี
          approval_status: status.toUpperCase(),
          reason,
          action_by: actionBy,
        }, conn);
      }

      // 3. Calculate New Status (Logic เดิมของคุณ)
      const approvedLevels = new Set(
        existingApprovals
          .filter((a) => a.approval_status === "APPROVE")
          .map((a) => a.level)
      );
      if (status === "approve") {
        approvedLevels.add(level);
      }

      // Reject Logic
      if (status === "reject") {
        const nextStatus = level === 1 ? 4 : 5; // 4=Reject by Head, 5=Reject by HR
        await OtModel.updateRequestStatus(requestId, nextStatus, conn); // ✅ ส่ง conn
        
        await conn.commit(); // ✅ Commit และจบงาน
        return true;
      }

      // Approve Logic
      const headApproved = approvedLevels.has(1);
      const hrApproved = approvedLevels.has(2);

      let nextStatus = 1; // Default Pending

      if (headApproved && hrApproved) {
        nextStatus = 3; // Fully Approved
      } else if (headApproved && !hrApproved) {
        nextStatus = 2; // Head Approved (Wait HR)
      } else if (!headApproved && hrApproved) {
        nextStatus = 1; // HR Done (Wait Head - แปลกๆ แต่ตาม Logic เดิม)
      }

      await OtModel.updateRequestStatus(requestId, nextStatus, conn); // ✅ ส่ง conn

      // ✅ Commit Transaction
      await conn.commit();
      return true;

    } catch (err) {
      // ✅ Rollback เมื่อพัง
      await conn.rollback();
      throw err; // โยนให้ Controller -> catchAsync -> GlobalError จัดการต่อ
    } finally {
      // ✅ คืน Connection
      conn.release();
    }
  },
};

export default approvalService;
