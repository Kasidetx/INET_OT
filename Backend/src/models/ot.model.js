import db from "../config/db.js";

const OtModel = {
  async AllEmployee(empId) {
    // เรียก Stored Procedure ง่ายๆ บรรทัดเดียว
    // ถ้า empId ไม่มีค่า ให้ส่ง null ไป
    const sql = `CALL GetEmployeeOTList(?)`;
    const [result] = await db.query(sql, [empId || null]);

    // ผลลัพธ์ของ Stored Procedure จะอยู่ใน array index ที่ 0
    const rows = result[0];

    // แปลง JSON String เป็น Object (เผื่อ Driver ส่งมาเป็น String)
    return rows.map((row) => ({
      ...row,
      requests:
        typeof row.requests === "string"
          ? JSON.parse(row.requests)
          : row.requests,
    }));
  },

  groupEmployeeData(rows) {
    const map = new Map();
    rows.forEach((row) => {
      const key = row.employee_id;
      if (!map.has(key)) {
        map.set(key, {
          id: row.employee_id,
          emp_id: row.employee_code,
          name: row.employee_name,
          position: row.position,
          total_requests: row.total_requests_count,
          total_ot_hour: row.total_ot_hour_summary,
          requests: [],
        });
      }
      if (row.ot_id) {
        // ถ้ามีข้อมูล OT
        map.get(key).requests.push({
          request_id: row.request_id,
          ot_id: row.ot_id,
          doc_no: row.doc_no,
          description: row.description,
          duration: row.ot_duration,
          start_time: row.start_time,
          end_time: row.end_time,
          created_at: row.created_at,
          status: row.req_status,
        });
      }
    });
    return Array.from(map.values());
  },

  async requestOt(empId) {
    const sql = `CALL GetMyRequests(?)`;
    const [result] = await db.query(sql, [empId]);
    return result[0]; // ส่งผลลัพธ์กลับได้เลย ไม่ต้อง map แล้ว
  },

  async findRequestById(id) {
    const sql = `SELECT * FROM request WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  async findById(id) {
    const sql = `SELECT * FROM ot WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  async getLastRequestDocNo() {
    const sql = "SELECT doc_no FROM request ORDER BY id DESC LIMIT 1";
    const [rows] = await db.query(sql);
    return rows[0]?.doc_no;
  },

  async createRequest(data, conn = null) {
    const sql = `
      INSERT INTO request (doc_no, title, type, sts, created_by, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const executor = conn || db;
    const [result] = await executor.query(sql, [
      data.doc_no,
      data.title,
      data.type,
      data.sts,
      data.created_by,
    ]);
    return result.insertId;
  },

  async create(data, conn = null) {
    const sql = `
      INSERT INTO ot (request_id, start_time, end_time, description, emp_id, total, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.request_id,
      data.start_time,
      data.end_time,
      data.description || null,
      data.emp_id,
      data.total || 0,
      data.created_by,
    ];
    const executor = conn || db;
    const [result] = await executor.query(sql, values);
    return { id: result.insertId, ...data };
  },

  async update(id, data, conn = null) {
    const sql = `
      UPDATE ot
      SET start_time = ?, end_time = ?, description = ?, emp_id = ?, total = ?, created_by = ?
      WHERE id = ?
    `;
    const values = [
      data.start_time,
      data.end_time,
      data.description || null,
      data.emp_id,
      data.total || 0,
      data.created_by,
      id,
    ];
    const executor = conn || db;
    const [result] = await executor.query(sql, values);
    return result.affectedRows > 0;
  },

  async updateRequestStatus(
    requestId,
    status,
    conn = null,
    reason = undefined
  ) {
    let sql = `UPDATE request SET sts = ?`;
    const params = [status];

    // ✅ เช็ค: ถ้ามีการส่ง reason มา (ไม่ว่าจะ null หรือข้อความ) ค่อยอัปเดต
    // ถ้าไม่ได้ส่งมา (undefined) ก็จะไม่ไปยุ่งกับคอลัมน์ reason เดิม
    if (reason !== undefined) {
      sql += `, reason = ?`;
      params.push(reason);
    }

    sql += ` WHERE id = ?`;
    params.push(requestId);

    const executor = conn || db;
    const [result] = await executor.query(sql, params);

    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default OtModel;
