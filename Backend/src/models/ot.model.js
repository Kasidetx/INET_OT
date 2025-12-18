import db from "../config/db.js";

const OtModel = {


  async AllEmployee() {
    const sql = `
    SELECT 
        e.id AS employee_id,
        e.emp_id AS employee_code,
        e.name AS employee_name,
        e.position,
        e.request AS total_requests_count,
        e.total_hour AS total_ot_hour_summary,
 
        
        v.request_id,
        v.description,
        v.total AS ot_duration,
        v.start_time,
        v.end_time,
        v.created_at,
        v.ot_status

    FROM view_employee e 
    LEFT JOIN view_emp_ot v ON e.emp_id = v.emp_id
    ORDER BY e.id ASC, v.created_at DESC`;

    const [flatRows] = await db.query(sql);
    const groupedData = this.groupEmployeeData(flatRows);
    return groupedData;
  },

  // function group
  groupEmployeeData(flatRows) {
    const employeesMap = new Map();

    for (const row of flatRows) {
      const { employee_code, request_id } = row;

      // A. จัดการข้อมูลพนักงานหลัก (Parent)
      if (!employeesMap.has(employee_code)) {
        const EmployeeInfo = {
          eid : row.employee_id,
          employee_code: employee_code,
          employee_name: row.employee_name,
          position: row.position,

          total_requests_count: row.total_requests_count,
          total_ot_hour_summary: row.total_ot_hour_summary,
          ot_requests: [],
        };

        employeesMap.set(employee_code, EmployeeInfo);
      }

      // B. จัดการข้อมูลรายละเอียด OT (Child)
      const currentEmployee = employeesMap.get(employee_code);

      if (request_id) {
        // มีรายละเอียด OT
        const otRequestDetail = {
         
          request_id: row.request_id,
          description: row.description,
          ot_duration: row.ot_duration,
          start_time: row.start_time,
          end_time: row.end_time,
          created_at: row.created_at,
          ot_status: row.ot_status,
        };

        currentEmployee.ot_requests.push(otRequestDetail);
      }
    }

    // คืนค่าเป็น Array
    return Array.from(employeesMap.values());
  },

  async requestOt() {
    const sql = `SELECT o.id, o.request_id, o.description, o.start_time, o.end_time, o.total, o.request_id, o.ot_status FROM ot o ORDER BY id ASC`
    const [rows] = await db.query(sql)
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
