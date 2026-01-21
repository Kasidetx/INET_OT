import db from "../config/db.js";

const approvalModel = {
  // ดึง approval ทั้ง flow ของ request
  async findByRequestId(requestId) {
    const sql = `
  SELECT
    a.id, a.request_id, a.level, a.approval_status, a.reason, a.org_chart, a.approve_emp,
    a.level_position, a.action_at, a.action_by, a.created_at,
    e.name AS approve_name
  FROM approval a
  LEFT JOIN employee e ON e.emp_id = a.approve_emp
  WHERE a.request_id = ?
  ORDER BY a.level ASC
`;

    const [rows] = await db.query(sql, [requestId]);
    return rows;
  },

  // หา level ที่ถึงคิวอนุมัติ
  async findCurrentLevel(requestId) {
    const sql = `
    SELECT
      id, request_id, level, approval_status, reason, org_chart, approve_emp,
      level_position, action_at, action_by, created_at
    FROM approval
    WHERE request_id = ?
      AND approval_status IN (1, 2)
    ORDER BY level ASC
    LIMIT 1
  `;
    const [rows] = await db.query(sql, [requestId]);
    return rows[0] || null;
  },

  async updateStatusByRequestId(requestId, status, conn = null) {
    const sql = `
      UPDATE approval
      SET approval_status = ?, action_at = ?
      WHERE request_id = ?
    `;

    const values = [status, new Date(), requestId];
    const executor = conn || db;

    // ใช้ query (สำหรับ mysql2/promise)
    await executor.query(sql, values);
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
      a.level === 1 ? 1 : 2,
      new Date(),
    ]);

    // ✅ ใช้ conn ถ้ามีส่งมา
    const executor = conn || db;
    await executor.query(sql, [values]);
  },

  // update ผลอนุมัติ
  async updateStatus(id, data, conn = null) {
    const sql = `
      UPDATE approval
      SET
        approval_status = ?,
        reason = ?,
        action_at = ?,
        action_by = ?
      WHERE id = ?
    `;

    const values = [
      data.approval_status,
      data.reason || null,
      new Date(),
      data.action_by,
      id,
    ];

    const executor = conn || db;
    const [result] = await executor.query(sql, values);
    return result.affectedRows;
  },

  async addApprovalLog(data, conn = null) {
    const sql = `
      INSERT INTO approval (
        request_id, level, approve_emp, approval_status, 
        reason, action_at, action_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.request_id,
      data.level,
      data.approve_emp,
      data.approval_status,
      data.reason || null,
      new Date(), // action_at
      data.action_by,
      new Date(), // created_at
    ];

    const executor = conn || db;
    const [result] = await executor.query(sql, values);
    return result.insertId;
  },
};

export default approvalModel;
