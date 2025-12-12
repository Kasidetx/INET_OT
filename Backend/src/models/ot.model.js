import db from "../config/db.js";

const OtModel = {
  async findAll() {
    const [rows] = await db.query("SELECT id, emp_id FROM ot ORDER BY id ASC");
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM ot WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create(data) {
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

    const [result] = await db.query(sql, values);

    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const sql = `
      UPDATE ot
      SET request_id = ?, start_time = ?, end_time = ?, description = ?, emp_id = ?, total = ?, created_by = ?
      WHERE id = ?
    `;

    const values = [
      data.request_id,
      data.start_time,
      data.end_time,
      data.description || null,
      data.emp_id,
      data.total || 0,
      data.created_by,
      id,
    ];

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default OtModel;
