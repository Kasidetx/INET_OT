import db from "../config/db.js";

const approvalModel = {
  // ดึง approval ทั้ง flow ของ request
  async findByRequestId(requestId) {
    const sql = `
    SELECT 
      a.*,
      e.name AS approve_name
    FROM approval a
    LEFT JOIN employee e
      ON e.emp_id = a.approve_emp
    WHERE a.request_id = ?
    ORDER BY a.level ASC
  `;
    const [rows] = await db.query(sql, [requestId]);
    return rows;
  },

  // หา level ที่ถึงคิวอนุมัติ
  async findCurrentLevel(requestId) {
    const sql = `
      SELECT *
      FROM approval
      WHERE request_id = ?
        AND approval_status = 'PENDING'
      ORDER BY level ASC
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [requestId]);
    return rows[0] || null;
  },

  async createFlow(requestId, approvers, conn = null) {
    const sql = `
      INSERT INTO approval
      (request_id, level, approve_emp, approval_status, created_at)
      VALUES ?
    `;

    const values = approvers.map((a) => [
      requestId,
      a.level,
      a.approve_emp,
      "PENDING",
      new Date(),
    ]);

    // ✅ ใช้ conn ถ้ามีส่งมา
    const executor = conn || db;
    await executor.query(sql, [values]);
  },

  // update ผลอนุมัติ
  async updateStatus(id, data, conn = null) {
    // ✅ เพิ่ม parameter conn
    const sql = `
      UPDATE approval
      SET
        approval_status = ?,
        reason = ?,
        action_at = ?,
        action_by = ?
      WHERE id = ?
    `;
    const executor = conn || db; // ✅ ใช้ executor
    const [result] = await executor.query(sql, [
      data.approval_status,
      data.reason || null,
      new Date(),
      data.action_by,
      id,
    ]);
    return result.affectedRows;
  },

  async addApprovalLog(data, conn = null) {
    const sql = `
      INSERT INTO approval
      (request_id, level, approve_emp, approval_status, reason, action_at, action_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // ✅ เลือกใช้ conn ที่ส่งมา หรือใช้ db ปกติ
    const executor = conn || db;
    const now = new Date();
    const [result] = await executor.query(sql, [
      data.request_id,
      data.level,
      data.approve_emp,
      data.approval_status,
      now,
      data.reason || null,
      data.action_by,
      now,
    ]);
    return result.insertId;
  },
};

export default approvalModel;
