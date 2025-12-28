import db from "../config/db.js";
import dayjs from "dayjs";
const WORK_START_TIME = "08:30:00";
const WORK_END_TIME = "17:30:00";

// --- Private Helpers (Logic Only) ---
// แยก Logic การตรวจสอบวันหยุดออกมา
const _getDayType = (dateObj, holidayList) => {
  const isWeekend = [0, 6].includes(dateObj.day());
  const isPublicHoliday = holidayList.includes(dateObj.format("YYYY-MM-DD"));
  return isWeekend || isPublicHoliday ? "HOLIDAY" : "WORKDAY";
};

// แยก Logic การหาช่วงเวลา (Before/During/After Work)
const _getPeriod = (cursor, workStart, workEnd) => {
  if (cursor.isBefore(workStart)) return "BEFORE_WORK";
  if (cursor.isBefore(workEnd)) return "DURING_WORK";
  return "AFTER_WORK";
};

// แยก Logic การคำนวณ Net Hours (หักพักเบรค)
const _calculateNetHours = (duration, config) => {
  if (!config) return duration;
  let net = duration;
  if (
    config.require_break == 1 &&
    duration >= parseFloat(config.min_continuous_hours)
  ) {
    net -= parseInt(config.break_minutes) / 60.0;
  }
  return Math.max(0, parseFloat(net.toFixed(2)));
};

const OtModel = {
  async AllEmployee(empId) {
    // 1. สร้างเงื่อนไข JOIN พื้นฐาน
    let joinCondition = "e.emp_id = v.emp_id";

    // ✅ LOGIC ใหม่: ถ้าเป็นการเรียกดูทั้งหมด (HR ดูหน้าอนุมัติ) ให้ซ่อน Status 0
    // แต่ถ้ามี empId (พนักงานดูหน้า Time Attendance) ให้โชว์ Status 0 ได้
    if (!empId) {
      joinCondition += " AND v.req_status != '0'";
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
    /* ✅ ใช้ตัวแปร joinCondition ที่เราสร้างแบบ Dynamic */
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

  async updateRequestStatus(requestId, status, description = null) {
    // อัปเดตสถานะ และวันที่แก้ไขล่าสุด (ถ้ามี field updated_at)
    let sql = `UPDATE request SET sts = ? WHERE id = ?`;
    let params = [status, requestId];

    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
  },

  generateNextDocNo(lastDocNo) {
    if (!lastDocNo) return "OT-1";
    const parts = lastDocNo.split("-");
    if (parts.length < 2) return "OT-1";

    const numberPart = parseInt(parts[1], 10);
    if (isNaN(numberPart)) return "OT-1";

    return `OT-${numberPart + 1}`;
  },

  calculateOtDetails(startStr, endStr, typeId, allConfigs, holidayList = []) {
    const reqStart = dayjs(startStr);
    const reqEnd = dayjs(endStr);

    if (reqEnd.isBefore(reqStart))
      throw new Error("End time must be after start time");

    // 1. Setup Variables
    const dateStr = reqStart.format("YYYY-MM-DD");
    const workStartBound = dayjs(`${dateStr} ${WORK_START_TIME}`);
    const workEndBound = dayjs(`${dateStr} ${WORK_END_TIME}`);
    const currentDayType = _getDayType(reqStart, holidayList);

    let currentCursor = reqStart;
    const detailsToInsert = [];
    let grandTotalHours = 0;

    // 2. Main Loop
    while (currentCursor.isBefore(reqEnd)) {
      const period = _getPeriod(currentCursor, workStartBound, workEndBound);

      // Determine End of this segment
      let nextCursor = reqEnd;
      if (period === "BEFORE_WORK")
        nextCursor = reqEnd.isBefore(workStartBound) ? reqEnd : workStartBound;
      else if (period === "DURING_WORK")
        nextCursor = reqEnd.isBefore(workEndBound) ? reqEnd : workEndBound;

      // Skip normal working hours on a workday
      if (currentDayType === "WORKDAY" && period === "DURING_WORK") {
        currentCursor = nextCursor;
        continue;
      }

      const segmentDuration = nextCursor.diff(currentCursor, "minute") / 60.0;

      if (segmentDuration > 0) {
        // Find Config
        const matchedConfig = allConfigs.find(
          (cfg) =>
            cfg.employee_type_id == typeId &&
            cfg.day_type === currentDayType &&
            cfg.ot_period === period
        );

        // Fallback config
        const config = matchedConfig || {
          rate: 1.0,
          min_continuous_hours: 99,
          require_break: 0,
          break_minutes: 0,
        };

        const netHours = _calculateNetHours(segmentDuration, config);

        if (netHours > 0) {
          detailsToInsert.push({
            ot_start_time: currentCursor.format("YYYY-MM-DD HH:mm:ss"),
            ot_end_time: nextCursor.format("YYYY-MM-DD HH:mm:ss"),
            ot_hour: netHours,
            ot_rate: config.rate || 1.0,
          });
          grandTotalHours += netHours;
        }
      }
      currentCursor = nextCursor;
    }

    return {
      total: parseFloat(grandTotalHours.toFixed(2)),
      details: detailsToInsert,
      dayType: currentDayType,
    };
  },

  async findById(id) {
    console.log(`Checking DB for OT ID: ${id}`); // <--- เพิ่มบรรทัดนี้
    const sql = `SELECT * FROM ot WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    console.log("Result:", rows); // <--- เพิ่มบรรทัดนี้
    return rows[0] || null;
  },
  // function group
  groupEmployeeData(flatRows) {
    const employeesMap = new Map();

    for (const row of flatRows) {
      const { employee_code, request_id } = row;

      // A. จัดการข้อมูลพนักงานหลัก (Parent)
      if (!employeesMap.has(employee_code)) {
        const EmployeeInfo = {
          eid: row.employee_id,
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
          ot_id: row.ot_id,
          request_id: row.request_id,
          doc_no: row.doc_no,
          description: row.description,
          ot_duration: row.ot_duration,
          start_time: row.start_time,
          end_time: row.end_time,
          created_at: row.created_at,
          sts: row.req_status,
        };

        currentEmployee.ot_requests.push(otRequestDetail);
      }
    }

    // คืนค่าเป็น Array
    return Array.from(employeesMap.values());
  },

  // หน้า 1
  async requestOt() {
    const sql = `
      SELECT 
        ot_id AS id, 
        request_id, 
        doc_no,
        description, 
        start_time, 
        end_time, 
        total, 
        req_status AS sts
      FROM view_emp_ot 
      /* ✅ เพิ่ม WHERE เพื่อกรอง Draft ออก */
      WHERE req_status != '0'
      ORDER BY ot_id ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  async findActiveRequest(empId) {
    const sql =
      "SELECT * FROM request WHERE created_by = ? AND sts = '1' ORDER BY created_at DESC LIMIT 1";
    const [rows] = await db.query(sql, [empId]);
    return rows[0];
  },

  // 2. หาเลขที่เอกสารล่าสุดเพื่อเอามา Gen เลขถัดไป
  async getLastRequestDocNo() {
    const sql = "SELECT doc_no FROM request ORDER BY id DESC LIMIT 1";
    const [rows] = await db.query(sql);
    return rows[0]?.doc_no;
  },

  // 3. สร้างใบคำขอ (Header) ใหม่
  async createRequest(data) {
    const sql = `
      INSERT INTO request (doc_no, title, type, sts, created_by, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.query(sql, [
      data.doc_no,
      data.title,
      data.type,
      data.sts,
      data.created_by,
    ]);

    return result.insertId;
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

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default OtModel;
