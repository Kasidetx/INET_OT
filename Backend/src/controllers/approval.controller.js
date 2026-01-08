import approvalModel from "../models/approval.model.js";
import approvalService from "../services/approval.service.js";

const approvalController = {
  // ดูสถานะ approval ของ request
  async getByRequest(req, res, next) {
    try {
      const data = await approvalModel.findByRequestId(req.params.requestId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  // กดอนุมัติ / ไม่อนุมัติ
  async approve(req, res, next) {
    try {
      const { requestId } = req.params;
      const { status, reason, action_by } = req.body;

      await approvalService.createApproval({
        requestId,
        status,
        reason,
        actionBy: action_by
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};

export default approvalController;
