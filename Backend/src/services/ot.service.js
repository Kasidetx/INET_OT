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
import {
  calculateOtDetails,
  generateNextDocNo,
} from "../utils/otCalculation.js";

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

      const lastDoc = await OtModel.getLastRequestDocNo();
      const docNo = generateNextDocNo(lastDoc);

      let total = 0;
      let details = [];

      // คำนวณยอดเงินและเวลา
      if (data.start_time && data.end_time) {
        const { allConfigs, holidayList, workdayConfigs } =
          await this._getSystemConfigs();

        // หา Type พนักงาน
        const targetEmpId = data.emp_id || data.created_by;
        const empProfile = await EmpModel.findByEmpId(targetEmpId);
        const realEmpTypeId = empProfile ? empProfile.employee_type_id : 1;

        const calcResult = calculateOtDetails(
          data.start_time,
          data.end_time,
          realEmpTypeId,
          allConfigs,
          holidayList,
          workdayConfigs
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // บันทึก Request -> OT Header
      const requestId = await OtModel.createRequest(
        {
          doc_no: docNo,
          title: data.title || "ขออนุมัติทำโอที",
          type: data.type || 1,
          sts: data.sts ?? 1,
          created_by: data.created_by,
        },
        conn
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
        conn
      );

      // บันทึก Details
      if (details.length > 0) {
        await OtDetailModel.createMany(createdOt.id, details, conn);
      }

      // สร้าง Flow อนุมัติ (ถ้าไม่ใช่ Draft)
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
          workdayConfigs
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // Update Header
      await OtModel.update(
        id,
        {
          // ถ้า data.x มีค่า ให้ใช้ data.x ถ้าไม่มี ให้ใช้ของเดิม (existingOt.x)
          start_time: data.start_time || existingOt.start_time,
          end_time: data.end_time || existingOt.end_time,

          // เช็ค !== undefined เพื่อรองรับกรณีส่งค่าว่าง "" มา
          description:
            data.description !== undefined
              ? data.description
              : existingOt.description,

          emp_id: data.emp_id || existingOt.emp_id,
          created_by: data.created_by || existingOt.created_by,
          total: total,
        },
        conn
      );

      if (data.sts !== undefined && existingOt.request_id) {
        // ✅ ส่ง 4 ตัวแปร: (id, status, conn, reason)
        await OtModel.updateRequestStatus(
          existingOt.request_id,
          data.sts,
          conn, // ตัวที่ 3: Connection
          data.cancellation_reason || null // ตัวที่ 4: Reason (ถ้าไม่มีให้ส่ง null ไปล้างค่าเก่า)
        );
      }

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
    const workdayConfigs = await WorkdayModel.findAll();

    try {
      await conn.beginTransaction();

      const processedRequestIds = new Set();

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
          workdayConfigs
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

  async recalculateAllPending() {
    try {
      // 1. ดึงรายการ OT ที่ยังค้างอยู่ (Pending)
      const pendingOts = await OtModel.findPendingOtIds();
      if (pendingOts.length === 0) return { message: "No pending OTs" };

      // 2. เตรียม Config ไว้ครั้งเดียว เพื่อไม่ต้อง Query ซ้ำใน Loop
      const { allConfigs, holidayList, workdayConfigs } =
        await this._getSystemConfigs();

      const conn = await db.getConnection();

      try {
        await conn.beginTransaction(); // เริ่ม Transaction

        // ✅ แก้ไข: ใช้ for...of เพื่อวนลูปทำทีละรายการ (ปลอดภัยกว่า Promise.all บน conn เดียว)
        for (const ot of pendingOts) {
          const realEmpTypeId = ot.preloaded_emp_type_id;

          // คำนวณยอดเงินและเวลาใหม่
          const calcResult = calculateOtDetails(
            ot.start_time,
            ot.end_time,
            realEmpTypeId,
            allConfigs,
            holidayList,
            workdayConfigs
          );

          // ลบรายละเอียดเดิมทิ้ง (ใช้ conn เดียวกัน)
          await conn.query("DELETE FROM ot_detail WHERE ot_id = ?", [ot.id]);

          // บันทึกรายละเอียดใหม่ (ถ้ามี)
          if (calcResult.details.length > 0) {
            await OtDetailModel.createMany(ot.id, calcResult.details, conn);
          }

          // อัปเดตยอดรวมที่ Header (ส่ง description: undefined เพื่อคงค่าเดิมไว้)
          await OtModel.update(
            ot.id,
            { ...ot, total: calcResult.total, description: undefined },
            conn
          );
        }

        await conn.commit(); // ยืนยันข้อมูลทั้งหมดลง Database
        console.log(`Recalculated ${pendingOts.length} pending OTs.`);
        return {
          success: true,
          message: `Recalculated ${pendingOts.length} pending OTs.`,
        };
      } catch (err) {
        await conn.rollback(); // ย้อนกลับถ้ารายการใดรายการหนึ่งพัง
        console.error("Recalculation error inside transaction:", err);
        throw err; // ส่ง Error ออกไปให้ Controller รับรู้
      } finally {
        conn.release(); // คืน Connection
      }
    } catch (err) {
      console.error("Global Recalculation Error:", err);
      throw err;
    }
  },
};
export default OtService;
