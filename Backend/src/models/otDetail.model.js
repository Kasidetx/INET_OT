import db from "../config/db.js";

const OtDetailModel = {
  async findAll() {
    const [rows] = await db.query(`
    SELECT id, ot_id, ot_start_time, ot_end_time, ot_hour, ot_rate, created_at
    FROM ot_detail
    ORDER BY id ASC
  `);
    return rows;
  },

  async findByOtId(otId, conn = null) {
    const sql = `
    SELECT id, ot_id, ot_start_time, ot_end_time, ot_hour, ot_rate, created_at
    FROM ot_detail
    WHERE ot_id = ?
    ORDER BY id ASC
  `;
    const executor = conn || db;
    const [rows] = await executor.query(sql, [otId]);
    return rows;
  },

  // ✅ แก้ไข: เพิ่ม parameter conn
  async createMany(otId, details, conn = null) {
    const sql = `
      INSERT INTO ot_detail (ot_id, ot_start_time, ot_end_time, ot_hour, ot_rate)
      VALUES ?
    `;
    const values = details.map((d) => [
      otId,
      d.ot_start_time,
      d.ot_end_time,
      d.ot_hour,
      d.ot_rate,
    ]);

    // ✅ ใช้ executor เพื่อให้ Query นี้อยู่ใน Transaction เดียวกับ Service
    const executor = conn || db;
    const [result] = await executor.query(sql, [values]);
    return result;
  },
};

export default OtDetailModel;
