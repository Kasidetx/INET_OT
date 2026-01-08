import db from "../config/db.js";
import dayjs from "dayjs";
import {
  WORK_TIME,
  DAY_TYPE,
  OT_PERIOD,
  OT_STATUS,
} from "../config/constants.js";

const OtModel = {
  async AllEmployee(empId) {
    let joinCondition = "e.emp_id = v.emp_id";
    if (!empId) {
      joinCondition += ` AND v.req_status != '${OT_STATUS.DRAFT}'`;
    }

    let sql = `
    SELECT 
        e.id AS employee_id,
        e.emp_id AS employee_code,
        e.name AS employee_name,
        e.position,
        e.request AS total_requests_count,
        e.total_hour AS total_ot_hour_summary,
        v.ot_id,
        v.request_id,
        v.doc_no,
        v.description,
        v.total AS ot_duration,
        v.start_time,
        v.end_time,
        v.created_at,
        v.req_status
    FROM view_employee e
    LEFT JOIN view_emp_ot v ON ${joinCondition}
    `;
    const params = [];

    if (empId) {
      sql += ` WHERE e.emp_id = ? `;
      params.push(empId);
    }

    sql += ` ORDER BY e.id ASC, v.created_at DESC`;
    const [flatRows] = await db.query(sql, params);
    return this.groupEmployeeData(flatRows);
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

  async requestOt(empId = null) {
    // ✅ รับ parameter empId
    // เริ่มต้น SQL พื้นฐาน
    let sql = `
      SELECT ot_id AS id, request_id, doc_no, description, start_time, end_time, total, req_status AS sts
      FROM view_emp_ot 
      WHERE req_status != '${OT_STATUS.DRAFT}'
    `;

    const params = [];

    if (empId) {
      sql += " AND emp_id = ? ";
      params.push(empId);
    }

    const [rows] = await db.query(sql, params);
    return rows;
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

  async updateRequestStatus(requestId, status, conn = null) {
    let sql = `UPDATE request SET sts = ? WHERE id = ?`;
    const executor = conn || db;
    const [result] = await executor.query(sql, [status, requestId]);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default OtModel;
