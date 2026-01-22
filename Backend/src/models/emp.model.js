import db from "../config/db.js";

const employee = {
  async findAll() {
    const sql = `
      SELECT id, emp_id, employee_type_id, name, position, created_at
      FROM employee
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  async findByEmpId(empId) {
    const sql = `
      SELECT id, emp_id, employee_type_id, name, position, 
             leader_emp_id, hr_emp_id, created_at
      FROM employee
      WHERE emp_id = ?
    `;
    const [rows] = await db.query(sql, [empId]);
    return rows[0] || null;
  },

  async create(data) {
    const sql =
      "INSERT INTO employee (emp_id, name, position) VALUES (?, ?, ?)";
    const values = [data.emp_id, data.name, data.position];
    const [result] = await db.query(sql, values);
    return { id: result.insertId, ...data };
  },
};

export default employee;
