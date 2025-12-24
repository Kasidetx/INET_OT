import db from "../config/db.js";
import dayjs from 'dayjs';
const WORK_START_TIME = "08:30:00";
const WORK_END_TIME = "17:30:00";
const OtModel = {
  async AllEmployee(empId) {
    let sql = `
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
    `;

    const params = [];

    // ตอนนี้รู้จัก empId แล้ว โค้ดนี้จะทำงานได้
    if (empId) {
      sql += ` WHERE e.emp_id = ? `;
      params.push(empId);
    }

    sql += ` ORDER BY e.id ASC, v.created_at DESC`;

    const [flatRows] = await db.query(sql, params);
    return this.groupEmployeeData(flatRows);
  },

  generateNextDocNo(lastDocNo) {
    if (!lastDocNo) return 'OT-1';
    const parts = lastDocNo.split('-');
    if (parts.length < 2) return 'OT-1';
    
    const numberPart = parseInt(parts[1], 10);
    if (isNaN(numberPart)) return 'OT-1';
    
    return `OT-${numberPart + 1}`;
  },

  calculateOtDetails(startStr, endStr, typeId, allConfigs, holidayList = []) {
    const reqStart = dayjs(startStr);
    const reqEnd = dayjs(endStr);
    
    if (reqEnd.isBefore(reqStart)) {
        throw new Error('End time must be after start time');
    }

    // =========================================================
    // LOGIC เช็ควันหยุด (Holiday Logic)
    // =========================================================
    // 1. เช็คว่าเป็นเสาร์-อาทิตย์ไหม? (0=Sun, 6=Sat)
    const isWeekend = reqStart.day() === 0 || reqStart.day() === 6;
    
    // 2. เช็คว่าวันที่ของ OT ตรงกับในตาราง Holiday ไหม?
    // แปลงวันที่ของ request เป็น YYYY-MM-DD เพื่อเทียบกับ list
    const dateKey = reqStart.format('YYYY-MM-DD');
    const isPublicHoliday = holidayList.includes(dateKey);

    // 3. ถ้าเป็น (เสาร์อาทิตย์) หรือ (ตรงกับวันหยุดนักขัตฤกษ์) => ถือเป็น HOLIDAY
    const currentDayType = (isWeekend || isPublicHoliday) ? 'HOLIDAY' : 'WORKDAY';
    // =========================================================

    let currentCursor = reqStart; 
    const detailsToInsert = [];
    let grandTotalHours = 0;

    const workStartBound = dayjs(reqStart.format('YYYY-MM-DD') + ' ' + WORK_START_TIME);
    const workEndBound   = dayjs(reqStart.format('YYYY-MM-DD') + ' ' + WORK_END_TIME);

    while (currentCursor.isBefore(reqEnd)) {
        let period = '';
        let nextCursor = null;

        if (currentCursor.isBefore(workStartBound)) {
            period = 'BEFORE_WORK';
            nextCursor = reqEnd.isBefore(workStartBound) ? reqEnd : workStartBound;
        } else if (currentCursor.isBefore(workEndBound)) {
            period = 'DURING_WORK';
            nextCursor = reqEnd.isBefore(workEndBound) ? reqEnd : workEndBound;
        } else {
            period = 'AFTER_WORK';
            nextCursor = reqEnd;
        }

        // หมายเหตุ: Logic นี้ยังคงเดิม คือถ้าเป็น WORKDAY และอยู่ในเวลางาน จะข้าม (ไม่จ่าย OT)
        // แต่ถ้า currentDayType กลายเป็น 'HOLIDAY' (เพราะตรงกับตาราง) บรรทัดนี้จะเป็น false และจะลงไปคำนวณเงินให้
        if (currentDayType === 'WORKDAY' && period === 'DURING_WORK') {
            currentCursor = nextCursor;
            continue; 
        }

        const segmentDuration = nextCursor.diff(currentCursor, 'minute') / 60.0;
        
        if (segmentDuration > 0) {
            // หา Config ที่ตรงกับเงื่อนไข (รวมถึงเช็ค HOLIDAY ที่เราเพิ่งแก้ด้วย)
            const matchedConfig = allConfigs.find(cfg => 
                cfg.employee_type_id == typeId && 
                cfg.day_type === currentDayType && // <--- ตรงนี้จะใช้ค่าใหม่ที่เช็คจาก DB แล้ว
                cfg.ot_period === period
            );
            
            const config = matchedConfig || { rate: 1.0, min_continuous_hours: 99, require_break: 0, break_minutes: 0 };
            
            let netHours = segmentDuration;
            if (config.require_break == 1 && segmentDuration >= parseFloat(config.min_continuous_hours)) {
                netHours -= (parseInt(config.break_minutes) / 60.0);
                if (netHours < 0) netHours = 0;
            }
            netHours = Math.round(netHours * 100) / 100;

            if (netHours > 0) {
                detailsToInsert.push({
                    ot_start_time: dayjs(currentCursor).format('YYYY-MM-DD HH:mm:ss'),
                    ot_end_time: dayjs(nextCursor).format('YYYY-MM-DD HH:mm:ss'),
                    ot_hour: netHours,
                    ot_rate: config.rate || 1.0
                });
                grandTotalHours += netHours;
            }
        }
        currentCursor = nextCursor;
    }

    return {
        total: grandTotalHours,
        details: detailsToInsert,
        dayType: currentDayType 
    };
  },

  async findById(id) {
    const sql = `SELECT * FROM ot WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
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

  // หน้า 1
  async requestOt() {
    const sql = `SELECT o.id, o.request_id, o.description, o.start_time, o.end_time, o.total, o.request_id, o.sts FROM ot o ORDER BY id ASC`;
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
      "1",
      data.created_by,
    ]);
    
    return result.insertId;
  },

  async create(data) {
    const sql = `
      INSERT INTO ot (request_id, start_time, end_time, description, emp_id, total, sts, created_by)
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
