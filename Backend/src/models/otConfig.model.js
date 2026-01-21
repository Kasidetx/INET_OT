import db from "../config/db.js";

// 1. พนักงานทำงานเวลาปกติ
// 2. พนักงานเข้ากะทำงานปกติ
// 3. พนักงานทำงานกะ 12 ชั่วโมง
// 4. พนักงานทำงานตามชั่วโมง

const OtConfigModel = {
  async findAll() {
    const sql = `
    SELECT
      id, name, employee_type_id, day_type, ot_period, rate,
      start_condition, start_time, min_continuous_hours,
      require_break, break_minutes, description, is_active, created_at
    FROM ot_config
    ORDER BY id ASC
  `;
    const [rows] = await db.query(sql);
    return rows;
  },

  async findById(id) {
    const sql = `
    SELECT
      id, name, employee_type_id, day_type, ot_period, rate,
      start_condition, start_time, min_continuous_hours,
      require_break, break_minutes, description, is_active, created_at
    FROM ot_config
    WHERE id = ?
  `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO ot_config (
        name, employee_type_id, day_type, ot_period, rate, 
        start_condition, start_time, min_continuous_hours, 
        require_break, break_minutes, description, is_active, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.name,
      data.employee_type_id,
      data.day_type,
      data.ot_period,
      data.rate,
      data.start_condition,
      data.start_time,
      data.min_continuous_hours,
      data.require_break,
      data.break_minutes,
      data.description,
      data.is_active,
      new Date()
    ];

    const [result] = await db.query(sql, values);
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const sql = `
      UPDATE ot_config
      SET 
        name = ?, 
        employee_type_id = ?, 
        day_type = ?, 
        ot_period = ?, 
        rate = ?,
        start_condition = ?, 
        start_time = ?,
        min_continuous_hours = ?, 
        require_break = ?, 
        break_minutes = ?, 
        description = ?, 
        is_active = ?
      WHERE id = ?
    `;

    const values = [
      data.name,
      data.employee_type_id,
      data.day_type,
      data.ot_period,
      data.rate,
      data.start_condition,
      data.start_time,
      data.min_continuous_hours,
      data.require_break,
      data.break_minutes,
      data.description,
      data.is_active,
      id,
    ];

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot_config WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default OtConfigModel;
