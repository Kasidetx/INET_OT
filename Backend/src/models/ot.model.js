import db from "../config/db.js";
import dayjs from "dayjs";

const OtModel = {
  async AllEmployee(empId) {
    const sql = `CALL GetEmployeeOTList(?)`;
    const [result] = await db.query(sql, [empId || null]);

    // Parse JSON result from Stored Procedure
    return result[0].map((row) => ({
      ...row,
      requests:
        typeof row.requests === "string"
          ? JSON.parse(row.requests)
          : row.requests,
    }));
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

  async requestOt(empId) {
    const sql = `CALL GetMyRequests(?)`;
    const [result] = await db.query(sql, [empId]);
    return result[0]; // ส่งผลลัพธ์กลับได้เลย ไม่ต้อง map แล้ว
  },

  async findRequestById(id) {
    const sql = `
    SELECT id, doc_no, title, type, sts, created_at, created_by, reason
    FROM request
    WHERE id = ?
  `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  async findById(id) {
    const sql = `
    SELECT id, request_id, start_time, end_time, description, emp_id, total, created_at, created_by
    FROM ot
    WHERE id = ?
  `;
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
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const executor = conn || db;
    const [result] = await executor.query(sql, [
      data.doc_no,
      data.title,
      data.type,
      data.sts,
      data.created_by,
      new Date(),
    ]);
    return result.insertId;
  },

  async create(data, conn = null) {
    const sql = `
      INSERT INTO ot (
        request_id, start_time, end_time, description, 
        emp_id, total, created_by
      )
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

  async getNextDocNo(conn) {
    // 1. เตรียมข้อมูลวันที่ปัจจุบัน (AD และ BE)
    const now = dayjs();
    const currentDateStr = now.format("YYYY-MM-DD"); // 2025-01-21 (ใช้เช็คกับ DB)

    // คำนวณปี พ.ศ. และ Format Prefix (25680121)
    const beYear = now.year() + 543;
    const month = now.format("MM");
    const day = now.format("DD");
    const docPrefix = `${beYear}${month}${day}`; // ex: 25680121

    // 2. Lock Row เพื่อความปลอดภัย (ห้ามใครแย่ง)
    const sqlGet =
      "SELECT current_value, last_run_date FROM running_sequence WHERE name = 'OT_REQUEST' FOR UPDATE";
    const [rows] = await conn.query(sqlGet);

    let nextVal = 1;

    if (rows.length > 0) {
      const row = rows[0];
      // แปลงวันที่จาก DB เป็น String เพื่อเปรียบเทียบ
      const dbDate = row.last_run_date
        ? dayjs(row.last_run_date).format("YYYY-MM-DD")
        : "";

      if (dbDate === currentDateStr) {
        // ถ้าเป็นวันเดิม -> นับต่อ
        nextVal = row.current_value + 1;
      } else {
        // ถ้าวันเปลี่ยนแล้ว -> รีเซ็ตเป็น 1
        nextVal = 1;
      }

      // บันทึกค่าล่าสุดกลับลงไป
      await conn.query(
        "UPDATE running_sequence SET current_value = ?, last_run_date = ? WHERE name = 'OT_REQUEST'",
        [nextVal, currentDateStr],
      );
    } else {
      // ถ้าเพิ่งรันระบบครั้งแรก Insert แถวใหม่เลย
      await conn.query(
        "INSERT INTO running_sequence (name, current_value, last_run_date) VALUES ('OT_REQUEST', 1, ?)",
        [currentDateStr],
      );
    }

    // 3. ประกอบร่าง: OT + 25680121 + 00001
    // padStart(5, '0') คือเติม 0 ข้างหน้าให้ครบ 5 หลัก
    return `OT-${docPrefix}${String(nextVal).padStart(5, "0")}`;
  },

  async updateRequestStatus(
    requestId,
    status,
    conn = null,
    reason = undefined,
  ) {
    let sql = `UPDATE request SET sts = ?`;
    const params = [status];

    // ✅ เช็ค: ถ้ามีการส่ง reason มา (ไม่ว่าจะ null หรือข้อความ) ค่อยอัปเดต
    // ถ้าไม่ได้ส่งมา (undefined) ก็จะไม่ไปยุ่งกับคอลัมน์ reason เดิม
    if (reason !== undefined) {
      sql += `, reason = ?`;
      params.push(reason);
    }

    sql += ` WHERE id = ?`;
    params.push(requestId);

    const executor = conn || db;
    const [result] = await executor.query(sql, params);

    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  async findPendingOtIds() {
    const sql = `
      SELECT 
        ot.id, ot.start_time, ot.end_time, ot.emp_id, ot.created_by,
        COALESCE(e.employee_type_id, 1) AS preloaded_emp_type_id
      FROM ot 
      JOIN request r ON ot.request_id = r.id 
      LEFT JOIN employee e ON e.emp_id = COALESCE(ot.emp_id, ot.created_by)
      WHERE r.sts IN (0, 1, 2)
    `;
    const [rows] = await db.query(sql);
    return rows;
  },
};

export default OtModel;
