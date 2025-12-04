import db from '../config/db.js';

const OtModel = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM ot ORDER BY id DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM ot WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO ot (start_time, end_time, description, total)
      VALUES (?, ?, ?, ?)
    `;
    const values = [
      data.start_time,
      data.end_time,
      data.description || null,
      data.total || 0
    ];

    const [result] = await db.query(sql, values);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const sql = `
      UPDATE ot
      SET start_time = ?, end_time = ?, description = ?, total = ?
      WHERE id = ?
    `;
    const values = [
      data.start_time,
      data.end_time,
      data.description || null,
      data.total || 0,
      id
    ];

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query('DELETE FROM ot WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default OtModel;
