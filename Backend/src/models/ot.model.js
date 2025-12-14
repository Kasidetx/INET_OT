import db from "../config/db.js";

const OtModel = {
  
  async findAll() {
    const [rows] = await db.query("SELECT v.id, v.request_id, v.description, v.total, v.start_time, v.end_time, v.created_at, v.ot_status FROM view_emp_id_ot2 v ORDER BY id ASC");
    return rows;
  },

  // async findColumns() {
  //   const [rows] = await db.query("SHOW COLUMNS FROM ot");
  //   return rows;
  // },

  async findById(id) {
    const [rows] = await db.query("SELECT v.id, v.request_id, v.description, v.total, v.start_time, v.end_time, v.created_at, v.ot_status FROM view_emp_id_ot2 v WHERE emp_id = ?", [id]);
    return rows;
  },

  async create(data) {
    const sql = `
      INSERT INTO ot (request_id, start_time, end_time, description, emp_id, total, ot_status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.request_id,
      data.start_time,
      data.end_time,
      data.description || null,
      data.emp_id,
      data.total || 0,
      data.ot_status || 1, // 1=Pending, 2=Approved, 3=Rejected, 4=Cancelled	
      data.created_by,
    ];

    const [result] = await db.query(sql, values);
    return { id: result.insertId, ...data };
    
  },

  async update(id, data) {
    const sql = `
      UPDATE ot
      SET request_id = ?, start_time = ?, end_time = ?, description = ?, emp_id = ?, total = ?, ot_status = ?, created_by = ?
      WHERE id = ?
    `;

    const values = [
      data.request_id,
      data.start_time,
      data.end_time,
      data.description || null,
      data.emp_id,
      data.total || 0,
      data.ot_status || 1, // 1=Pending, 2=Approved, 3=Rejected, 4=Cancelled	
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
