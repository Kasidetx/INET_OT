// src/services/ot.service.js
import db from "../config/db.js";
import OtModel from "../models/ot.model.js";
import ApprovalModel from "../models/approval.model.js";
import OtDetailModel from "../models/otDetail.model.js";
import OtConfigModel from "../models/otConfig.model.js";
import HolidayModel from "../models/holiday.model.js";
import dayjs from "dayjs";
import { WORK_TIME, DAY_TYPE, OT_PERIOD } from "../config/constants.js";

// --- Private Helpers (Logic การคำนวณ ย้ายมาจาก Model) ---
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

const _generateNextDocNo = (lastDocNo) => {
  if (!lastDocNo) return "OT-1";
  const parts = lastDocNo.split("-");
  if (parts.length < 2) return "OT-1";
  const numberPart = parseInt(parts[1], 10);
  if (isNaN(numberPart)) return "OT-1";
  return `OT-${numberPart + 1}`;
};

// --- Service Logic ---
const OtService = {
  // ฟังก์ชันคำนวณหลัก (ย้ายมาจาก Model)
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

      if (currentDayType === DAY_TYPE.WORKDAY && period === OT_PERIOD.DURING) {
        currentCursor = nextCursor;
        continue;
      }

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
    };
  },

  async createApprovalFlow(requestId, data, conn) {
    const approvers = [
      { level: 1, approve_emp: data.leader_emp_id },
      { level: 2, approve_emp: "hr001" },
    ];
    await ApprovalModel.createFlow(requestId, approvers, conn);
  },

  async createOt(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Generate Doc No ที่ Service นี้ (ไม่ต้องให้ Controller ทำ)
      const lastDoc = await OtModel.getLastRequestDocNo();
      const docNo = _generateNextDocNo(lastDoc);

      // 2. Prepare Calculation Data
      let total = 0;
      let details = [];
      if (data.start_time && data.end_time) {
        const holidayList = await HolidayModel.getHolidayDateList();
        const allConfigs = await OtConfigModel.findAll();
        // เรียกใช้ฟังก์ชันใน Service ตัวเอง
        const calcResult = this.calculateOtDetails(
          data.start_time,
          data.end_time,
          data.type || 1,
          allConfigs,
          holidayList
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // 3. Insert Request
      const requestId = await OtModel.createRequest(
        {
          doc_no: docNo,
          title: data.title || data.description || "ขออนุมัติทำโอที",
          type: data.type || 1,
          sts: data.sts ?? 1,
          created_by: data.created_by,
        },
        conn
      );

      // 4. Insert OT Header
      const createdOt = await OtModel.create(
        {
          request_id: requestId,
          start_time: dayjs(data.start_time).format("YYYY-MM-DD HH:mm:ss"),
          end_time: dayjs(data.end_time).format("YYYY-MM-DD HH:mm:ss"),
          description: data.description,
          emp_id: data.emp_id || data.created_by,
          total,
          created_by: data.created_by,
        },
        conn
      );

      // 5. Insert Details
      if (details.length > 0) {
        await OtDetailModel.createMany(createdOt.id, details, conn);
      }

      // 6. Create Approval Flow (ถ้าไม่ใช่ Draft)
      if (data.sts !== 0) {
        if (!data.leader_emp_id) throw new Error("ต้องระบุรหัสหัวหน้างาน");
        await this.createApprovalFlow(requestId, { ...data }, conn);
      }

      await conn.commit();
      return { ...createdOt, details, request_id: requestId, doc_no: docNo };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateOt(id, data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // ตรวจสอบว่า OT นี้มีอยู่จริงไหม
      const existingOt = await OtModel.findById(id);
      if (!existingOt) throw new Error("ไม่พบข้อมูล OT");

      // คำนวณใหม่ (Logic เดียวกับ create)
      let total = existingOt.total;
      let details = [];

      // ถ้ามีการเปลี่ยนเวลา ต้องคำนวณใหม่
      if (data.start_time || data.end_time) {
        const startTime = data.start_time || existingOt.start_time;
        const endTime = data.end_time || existingOt.end_time;
        const holidayList = await HolidayModel.getHolidayDateList();
        const allConfigs = await OtConfigModel.findAll();

        const calcResult = this.calculateOtDetails(
          startTime,
          endTime,
          data.type || 1,
          allConfigs,
          holidayList
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // Update Header
      await OtModel.update(
        id,
        {
          ...data,
          total: total,
          emp_id: data.emp_id || existingOt.emp_id,
          created_by: data.created_by || existingOt.created_by,
        },
        conn
      );

      // Update Details (ถ้ามีการคำนวณใหม่)
      if (details.length > 0) {
        // ลบของเก่า -> ลงของใหม่
        await conn.query("DELETE FROM ot_detail WHERE ot_id = ?", [id]);
        await OtDetailModel.createMany(id, details, conn);
      }

      await conn.commit();
      return { id, message: "Update success" };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async addOtDetails(otId, detailsData) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert รายละเอียดใหม่
      await OtDetailModel.createMany(otId, detailsData, conn);

      // 2. คำนวณยอดรวมใหม่ (ต้องดึงข้อมูลผ่าน conn เดียวกัน)
      const allDetails = await OtDetailModel.findByOtId(otId, conn);
      const totalHour = allDetails.reduce(
        (sum, d) => sum + (d.ot_hour || 0),
        0
      );

      // 3. Update Header
      const header = await OtModel.findById(otId); // findById อ่านอย่างเดียว ไม่ซีเรียสเรื่อง conn มากนัก แต่ถ้าจะให้ดีควรแก้ให้รับ conn ด้วย
      await OtModel.update(otId, { ...header, total: totalHour }, conn);

      await conn.commit();
      return { ot_id: otId, total_hour: totalHour, details: allDetails };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async submitOtRequest(items, leader_emp_id) {
    const conn = await db.getConnection();

    // เตรียมข้อมูล Config ครั้งเดียวเพื่อลดการ Query ซ้ำๆ ใน Loop
    const allConfigs = await OtConfigModel.findAll();
    const holidayList = await HolidayModel.getHolidayDateList();

    try {
      await conn.beginTransaction();

      const processedRequestIds = new Set();

      // 1. วนลูปคำนวณและอัปเดตรายละเอียด OT แต่ละรายการ
      for (const item of items) {
        // ใช้ Model ดึงข้อมูล (Read ไม่ต้องใช้ conn ก็ได้)
        const otData = await OtModel.findById(item.id);
        if (!otData) continue;

        // คำนวณยอดเงิน/ชั่วโมงใหม่ (เผื่อมีการแก้ไขเวลาก่อนกดส่ง)
        const { total, details } = this.calculateOtDetails(
          otData.start_time,
          otData.end_time,
          1, // สมมติ type=1 (OT ปกติ)
          allConfigs,
          holidayList
        );

        // Update Details (ลบเก่า -> สร้างใหม่)
        if (details.length > 0) {
          await conn.query("DELETE FROM ot_detail WHERE ot_id = ?", [
            otData.id,
          ]);
          await OtDetailModel.createMany(otData.id, details, conn);
        }

        // Update Header Total
        await OtModel.update(otData.id, { ...otData, total }, conn);

        // เก็บ Request ID ไว้ (เพื่อไปเปลี่ยนสถานะและสร้าง Flow)
        if (otData.request_id) {
          processedRequestIds.add(otData.request_id);
        }
      }

      // 2. วนลูป Request ID ที่ไม่ซ้ำ เพื่อเปลี่ยนสถานะและสร้าง Flow
      for (const reqId of processedRequestIds) {
        // เปลี่ยนสถานะเป็น 1 (Submit/รออนุมัติ)
        await OtModel.updateRequestStatus(reqId, 1, conn);

        // สร้าง Approval Flow ทันที โดยใช้ leader_emp_id ที่ส่งมา
        await this.createApprovalFlow(reqId, { leader_emp_id }, conn);
      }

      await conn.commit();
      return { success: true, processed_count: items.length };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

export default OtService;
