import db from "../config/db.js";
import dayjs from "dayjs";
import {
  WORK_TIME,
  DAY_TYPE,
  OT_PERIOD,
  OT_STATUS,
} from "../config/constants.js";

// --- Private Helpers (Logic Only) ---
const _getDayType = (dateObj, holidayList) => {
  const isWeekend = [0, 6].includes(dateObj.day());
  const isPublicHoliday = holidayList.includes(dateObj.format("YYYY-MM-DD"));
  return isWeekend || isPublicHoliday ? DAY_TYPE.HOLIDAY : DAY_TYPE.WORKDAY;
};

const _getPeriod = (cursor, workStart, workEnd) => {
  if (cursor.isBefore(workStart)) return OT_PERIOD.BEFORE;
  if (cursor.isBefore(workEnd)) return OT_PERIOD.DURING;
  return OT_PERIOD.AFTER;
};

// แยก Logic การคำนวณ Net Hours (หักพักเบรค)
const _calculateNetHours = (duration, config) => {
  if (!config) return duration;
  let net = duration;

  // ตรวจสอบเงื่อนไขหักพักเบรค (ถ้ามี)
  if (
    config.require_break == 1 &&
    duration >= parseFloat(config.min_continuous_hours)
  ) {
    net -= parseInt(config.break_minutes) / 60.0;
  }

  // ✅ จุดสำคัญ: ใช้ toFixed(2) เพื่อเก็บทศนิยม 2 ตำแหน่ง (เช่น 0.50)
  // parseFloat จะแปลงกลับเป็น number (เช่น 0.5) ไม่มีการปัดเป็นจำนวนเต็ม
  return Math.max(0, parseFloat(net.toFixed(2)));
};

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

  async updateRequestStatus(requestId, status, description = null, conn = null) {
    let sql = `UPDATE request SET sts = ? WHERE id = ?`;
    let params = [status, requestId];
    const executor = conn || db;
    const [result] = await executor.query(sql, params);
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

  // --- Main Logic Calculation ---
  calculateOtDetails(startStr, endStr, typeId, allConfigs, holidayList = []) {
    const reqStart = dayjs(startStr);
    const reqEnd = dayjs(endStr);

    if (reqEnd.isBefore(reqStart))
      throw new Error("End time must be after start time");

    const dateStr = reqStart.format("YYYY-MM-DD");
    const workStartBound = dayjs(`${dateStr} ${WORK_TIME.START}`);
    const workEndBound = dayjs(`${dateStr} ${WORK_TIME.END}`);
    const currentDayType = _getDayType(reqStart, holidayList);

    let currentCursor = reqStart;
    const detailsToInsert = [];
    let grandTotalHours = 0;

    while (currentCursor.isBefore(reqEnd)) {
      const period = _getPeriod(currentCursor, workStartBound, workEndBound);
      let nextCursor = reqEnd;

      if (period === "BEFORE_WORK")
        nextCursor = reqEnd.isBefore(workStartBound) ? reqEnd : workStartBound;
      else if (period === "DURING_WORK")
        nextCursor = reqEnd.isBefore(workEndBound) ? reqEnd : workEndBound;

      // Skip normal working hours on a workday
      if (currentDayType === DAY_TYPE.WORKDAY && period === OT_PERIOD.DURING) {
        currentCursor = nextCursor;
        continue;
      }

      // ✅ คำนวณเป็นทศนิยมจริง (นาที / 60) เช่น 30/60 = 0.5
      const segmentDuration = nextCursor.diff(currentCursor, "minute") / 60.0;

      if (segmentDuration > 0) {
        const matchedConfig = allConfigs.find(
          (cfg) =>
            cfg.employee_type_id == typeId &&
            cfg.day_type === currentDayType &&
            cfg.ot_period === period
        );

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
            ot_hour: netHours, // ค่านี้จะเป็น 0.5, 1.5 ตามจริง
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
    const sql = `SELECT * FROM ot WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  groupEmployeeData(flatRows) {
    const employeesMap = new Map();
    for (const row of flatRows) {
      const { employee_code, request_id } = row;
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

      const currentEmployee = employeesMap.get(employee_code);
      if (request_id) {
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
    return Array.from(employeesMap.values());
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

  async findActiveRequest(empId) {
    const sql =
      "SELECT * FROM request WHERE created_by = ? AND sts = '${OT_STATUS.SUBMIT}' ORDER BY created_at DESC LIMIT 1";
    const [rows] = await db.query(sql, [empId]);
    return rows[0];
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
    // ✅ แก้ไข: ถ้ามี conn ให้ใช้ conn (transaction) ถ้าไม่มีใช้ db ปกติ
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
    // ✅ แก้ไข: ใช้ executor
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

  async remove(id) {
    const [result] = await db.query("DELETE FROM ot WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

export default OtModel;
