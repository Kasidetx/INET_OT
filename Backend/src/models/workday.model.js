import db from "../config/db.js";

const WorkdayModel = {
  async findAll() {
    const [rows] = await db.query(`
    SELECT id, name, work_day, work_hour, start_time, end_time, created_at
    FROM workday
    ORDER BY id DESC
  `);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      `
    SELECT id, name, work_day, work_hour, start_time, end_time, created_at
    FROM workday
    WHERE id = ?
  `,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO workday (name, work_day, work_hour, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      data.name,
      data.work_day,
      data.work_hour || null,
      data.start_time,
      data.end_time,
    ];

    const [result] = await db.query(sql, values);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const sql = `
      UPDATE workday
      SET name = ?, work_day = ?, work_hour = ?, start_time = ?, end_time = ?
      WHERE id = ?
    `;
    const values = [
      data.name,
      data.work_day,
      data.work_hour || null,
      data.start_time,
      data.end_time,
      id,
    ];

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM workday WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default WorkdayModel;
