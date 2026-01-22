// src/services/ot.service.js
import db from "../config/db.js";
import OtModel from "../models/ot.model.js";
import ApprovalModel from "../models/approval.model.js";
import OtDetailModel from "../models/otDetail.model.js";
import OtConfigModel from "../models/otConfig.model.js";
import HolidayModel from "../models/holiday.model.js";
import WorkdayModel from "../models/workday.model.js";
import EmpModel from "../models/emp.model.js";
import dayjs from "dayjs";
import { calculateOtDetails } from "../utils/otCalculation.js";

// --- Service Logic ---
const OtService = {
  // ฟังก์ชันคำนวณหลัก (ย้ายมาจาก Model)

  async _getSystemConfigs() {
    // ใช้ Promise.all เพื่อดึงข้อมูลพร้อมกัน (Parallel Execution) เร็วกว่า await ทีละบรรทัด
    const [allConfigs, holidayList, workdayConfigs] = await Promise.all([
      OtConfigModel.findAll(),
      HolidayModel.getHolidayDateList(),
      WorkdayModel.findAll(),
    ]);
    return { allConfigs, holidayList, workdayConfigs };
  },

  async createApprovalFlow(requestId, data, conn) {
    const ownerId = data.emp_id || data.created_by;
    const empProfile = await EmpModel.findByEmpId(ownerId);

    if (!empProfile) {
      throw new Error("ไม่พบข้อมูลพนักงานเจ้าของคำขอ");
    }

    const approverLevel1 = empProfile.leader_emp_id;

    const approverLevel2 = empProfile.hr_emp_id;

    const approvers = [
      { level: 1, approve_emp: approverLevel1 }, // หัวหน้า
      { level: 2, approve_emp: approverLevel2 }, // HR
    ];

    // สร้าง Flow ในฐานข้อมูล
    await ApprovalModel.createFlow(requestId, approvers, conn);
  },

  async createOt(data) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Prepare Data
      const docNo = await OtModel.getNextDocNo(conn);
      let total = 0;
      let details = [];

      // 2. Calculate OT (ถ้ามีเวลา)
      if (data.start_time && data.end_time) {
        const { allConfigs, holidayList, workdayConfigs } =
          await this._getSystemConfigs();

        const targetEmpId = data.emp_id || data.created_by;

        const calcResult = calculateOtDetails(
          data.start_time,
          data.end_time,
          targetEmpId,
          allConfigs,
          holidayList,
          workdayConfigs,
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // 3. Insert Request & Header
      const requestId = await OtModel.createRequest(
        {
          doc_no: docNo,
          title: data.title || "ขออนุมัติทำโอที",
          type: data.type || 1,
          sts: data.sts ?? 1,
          created_by: data.created_by,
        },
        conn,
      );

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
        conn,
      );

      // 4. Insert Details & Flow
      if (details.length > 0) {
        await OtDetailModel.createMany(createdOt.id, details, conn);
      }

      if (data.sts !== 0) {
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
      const existingOt = await OtModel.findById(id);
      if (!existingOt) throw new Error("ไม่พบข้อมูล OT");

      let total = existingOt.total;
      let details = [];

      if (data.start_time || data.end_time) {
        const startTime = data.start_time || existingOt.start_time;
        const endTime = data.end_time || existingOt.end_time;
        const holidayList = await HolidayModel.getHolidayDateList();
        const allConfigs = await OtConfigModel.findAll();
        const workdayConfigs = await WorkdayModel.findAll();

        // ✅ [FIX] ดึง Employee Type
        // ต้องใช้ emp_id ของเดิมจาก OT หรืออันใหม่ที่ส่งมาแก้ไข
        const targetEmpId = data.emp_id || existingOt.emp_id;
        const empProfile = await EmpModel.findByEmpId(targetEmpId);
        const realEmpTypeId = empProfile ? empProfile.employee_type_id : 1;

        const calcResult = calculateOtDetails(
          startTime,
          endTime,
          realEmpTypeId, // ✅ ใช้ Type จริง
          allConfigs,
          holidayList,
          workdayConfigs,
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // Update Header
      await OtModel.update(
        id,
        {
          start_time: data.start_time || existingOt.start_time,
          end_time: data.end_time || existingOt.end_time,
          description:
            data.description !== undefined
              ? data.description
              : existingOt.description,
          emp_id: data.emp_id || existingOt.emp_id,
          created_by: data.created_by || existingOt.created_by,
          total: total,
        },
        conn,
      );

      if (data.sts !== undefined && existingOt.request_id) {
        // ✅ 1. อัปเดตสถานะในตาราง Request (ตาม code เดิม)
        await OtModel.updateRequestStatus(
          existingOt.request_id,
          data.sts,
          conn,
          data.cancellation_reason || null,
        );

        // ✅ 2. [เพิ่มส่วนนี้] ถ้าสถานะเป็น 0 (ยกเลิก) หรือ 6 ให้ไปอัปเดตตาราง Approval เป็น 6 ด้วย
        if (data.sts === 0 || data.sts === 6) {
          await ApprovalModel.updateStatusByRequestId(
            existingOt.request_id,
            6,
            conn,
          );
        }
      }

      // Update Details (ถ้ามีการคำนวณใหม่)
      if (details.length > 0) {
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
        0,
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

  async submitOtRequest(items) {
    const conn = await db.getConnection();

    // เตรียมข้อมูล Config ครั้งเดียวเพื่อลดการ Query ซ้ำๆ ใน Loop
    const allConfigs = await OtConfigModel.findAll();
    const holidayList = await HolidayModel.getHolidayDateList();
    const workdayConfigs = await WorkdayModel.findAll();

    try {
      await conn.beginTransaction();

      const requestOwnerMap = new Map();

      // 1. วนลูปคำนวณและอัปเดตรายละเอียด OT แต่ละรายการ
      for (const item of items) {
        const otData = await OtModel.findById(item.id);
        if (!otData) continue;

        // -------------------------------------------------------
        // ✅ [FIX START] ต้องหา Type พนักงานก่อนคำนวณ
        // -------------------------------------------------------
        const targetEmpId = otData.emp_id || otData.created_by;
        const empProfile = await EmpModel.findByEmpId(targetEmpId);
        const realEmpTypeId = empProfile ? empProfile.employee_type_id : 1;
        // -------------------------------------------------------

        // คำนวณยอดเงิน/ชั่วโมงใหม่
        const { total, details } = calculateOtDetails(
          otData.start_time,
          otData.end_time,
          realEmpTypeId, // ✅ ใส่ตัวแปรที่หามาแทนเลข 1
          allConfigs,
          holidayList,
          workdayConfigs,
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
          requestOwnerMap.set(otData.request_id, targetEmpId);
        }
      }

      // 2. วนลูป Request ID ที่ไม่ซ้ำ เพื่อเปลี่ยนสถานะและสร้าง Flow
      for (const [reqId, empId] of requestOwnerMap) {
        // เปลี่ยนสถานะเป็น 1 (Submit)
        await OtModel.updateRequestStatus(reqId, 1, conn);

        // สร้าง Approval Flow
        // 🔥 จุดสำคัญ: ส่ง emp_id เข้าไปให้ createApprovalFlow ด้วย
        await this.createApprovalFlow(
          reqId,
          {
            emp_id: empId, // <--- เพิ่มบรรทัดนี้ครับ
          },
          conn,
        );
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

  async recalculateAllPending() {
    // 1. หา OT ที่ค้างอยู่
    const pendingOts = await OtModel.findPendingOtIds();
    if (pendingOts.length === 0) return { message: "No pending OTs" };

    // 2. ดึง Config ครั้งเดียว
    const { allConfigs, holidayList, workdayConfigs } =
      await this._getSystemConfigs();

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 3. Loop Process (Sequential)
      for (const ot of pendingOts) {
        const realEmpTypeId = ot.preloaded_emp_type_id || 1;

        // คำนวณใหม่
        const calcResult = calculateOtDetails(
          ot.start_time,
          ot.end_time,
          realEmpTypeId,
          allConfigs,
          holidayList,
          workdayConfigs,
        );

        // Update DB
        await conn.query("DELETE FROM ot_detail WHERE ot_id = ?", [ot.id]);

        if (calcResult.details.length > 0) {
          await OtDetailModel.createMany(ot.id, calcResult.details, conn);
        }

        await OtModel.update(
          ot.id,
          {
            ...ot,
            total: calcResult.total,
            description: undefined, // ไม่แก้ Description เดิม
          },
          conn,
        );
      }

      await conn.commit();
      console.log(`Recalculated ${pendingOts.length} pending OTs.`);
      return { success: true, count: pendingOts.length };
    } catch (err) {
      await conn.rollback();
      console.error("Recalculation error:", err);
      throw err;
    } finally {
      conn.release();
    }
  },
};
export default OtService;
