// src/models/otDetail.model.js
import db from "../config/db.js";

const OtDetailModel = {
  // ดึงรายการ detail ทั้งหมด
  async findAll() {
    const [rows] = await db.query("SELECT * FROM ot_detail ORDER BY id ASC");
    return rows;
  },

  // ดึงรายการ detail ทั้งหมดของ OT ใบหนึ่ง
  async findByOtId(otId) {
    const [rows] = await db.query(
      "SELECT * FROM ot_detail WHERE ot_id = ? ORDER BY id ASC",
      [otId]
    );
    return rows;
  },

  // สร้างแถวเดียว
  async createOne(otId, detail) {
    const sql = `
      INSERT INTO ot_detail (ot_id, ot_start_time, ot_end_time, ot_hour, ot_rate)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      otId,
      detail.ot_start_time,
      detail.ot_end_time,
      detail.ot_hour,
      detail.ot_rate,
    ];

    const [result] = await db.query(sql, values);
    return { id: result.insertId, ot_id: otId, ...detail };
  },

  // สร้างหลายแถวรวดเดียว (array)
  async createMany(otId, details) {
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

    const [result] = await db.query(sql, [values]);
    return result;
  },
};

export default OtDetailModel;
