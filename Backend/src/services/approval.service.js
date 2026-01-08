import approvalModel from "../models/approval.model.js";
import OtModel from "../models/ot.model.js";

const approvalService = {
  async createApproval({ requestId, status, reason, actionBy }) {
    // 1. Get Request & Existing Approvals
    const request = await OtModel.getRequestById(requestId);
    if (!request) throw new Error("Request not found");

    const existingApprovals = await approvalModel.findByRequestId(requestId);

    // Determine the current user's level based on actionBy
    let level = 0;
    if (actionBy.startsWith('head')) level = 1;
    else if (actionBy.startsWith('hr')) level = 2;
    // Fallback logic if actionBy doesn't match standard pattern
    if (level === 0) {
      // Simple heuristic: If passed via API as specific level, good.
      // If not, we rely on the caller or default.
      // For this implementation, let's assume if existing approval has level 1, this is level 2.
      // But parallel means order doesn't matter.
      // SAFETY: If we can't determine, throw error or default to 1?
      // Let's assume the frontend sends correct actionBy.
      // As a fallback for testing:
      const hasHead = existingApprovals.some(a => a.level == 1 && a.approval_status == 'APPROVE');
      level = hasHead ? 2 : 1;
    }

    // 2. Insert Log First
    // 2. Find Pending Approval for this Level & Update
    const targetApproval = existingApprovals.find(a =>
      a.level === level && a.approval_status === 'PENDING'
    );

    if (targetApproval) {
      await approvalModel.updateStatus(targetApproval.id, {
        approval_status: status.toUpperCase(),
        reason,
        action_by: actionBy
      });
    } else {
      // Fallback: If no pending approval found (maybe already approved or data inconsistency),
      // we could log a warning or throw. For now, we'll try to update ANY row for this level
      // or just log it as a new entry if we really wanted to be safe, but the requirement 
      // is to "update row".
      // Let's try to find ANY row at this level.
      const anyApprovalAtLevel = existingApprovals.find(a => a.level === level);
      if (anyApprovalAtLevel) {
        await approvalModel.updateStatus(anyApprovalAtLevel.id, {
          approval_status: status.toUpperCase(),
          reason,
          action_by: actionBy
        });
      } else {
        // Fallback: If no row exists (e.g. legacy data), create it
        await approvalModel.addApprovalLog({
          request_id: requestId,
          level,
          approve_emp: actionBy,
          approval_status: status.toUpperCase(),
          reason,
          action_by: actionBy
        });
      }
    }

    // 3. Calculate New Status (Parallel Logic)

    // Helper: Get set of approved levels *including* the one just added
    const approvedLevels = new Set(
      existingApprovals
        .filter(a => a.approval_status === 'APPROVE')
        .map(a => a.level)
    );

    if (status === 'approve') {
      approvedLevels.add(level);
    }

    // Reject Logic: Instant Rejection
    if (status === 'reject') {
      const nextStatus = level === 1 ? 4 : 5;
      await OtModel.updateRequestStatus(requestId, nextStatus);
      return true;
    }

    // Approve Logic: Check Combination
    const headApproved = approvedLevels.has(1);
    const hrApproved = approvedLevels.has(2);

    let nextStatus = 1; // Default: Submitted/Pending

    if (headApproved && hrApproved) {
      nextStatus = 3; // Fully Approved
    } else if (headApproved && !hrApproved) {
      nextStatus = 2; // Head Approved (Pending HR)
    } else if (!headApproved && hrApproved) {
      nextStatus = 1; // HR Done, Waiting Head (Status remains 1 per requirement)
    }

    await OtModel.updateRequestStatus(requestId, nextStatus);
    return true;
  }
};

export default approvalService;
