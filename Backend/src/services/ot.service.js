import db from "../config/db.js";
import OtModel from "../models/ot.model.js";
import ApprovalModel from "../models/approval.model.js";
import OtDetailModel from "../models/otDetail.model.js";
import OtConfigModel from "../models/otConfig.model.js";
import HolidayModel from "../models/holiday.model.js";
import dayjs from "dayjs";

const OtService = {
  async createApprovalFlow(requestId, data, conn) {
    const approvers = [
      { level: 1, approve_emp: data.leader_emp_id }, // หัวหน้าที่ส่งมาจาก Frontend
      { level: 2, approve_emp: "hr001" }, // HR (Hardcode หรือดึงจาก Config)
    ];
    await ApprovalModel.createFlow(requestId, approvers, conn);
  },

  async createOt(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        doc_no,
        title,
        type,
        sts,
        created_by,
        start_time,
        end_time,
        description,
        leader_emp_id,
        emp_id,
      } = data;

      // 1. Create Request
      const requestId = await OtModel.createRequest(
        {
          doc_no,
          title: title || description || "ขออนุมัติทำโอที",
          type: type || 1,
          sts: sts ?? 1,
          created_by,
        },
        conn
      );

      // 2. Logic: Calculate Details
      let total = 0;
      let details = [];

      if (start_time && end_time) {
        const holidayList = await HolidayModel.getHolidayDateList();
        const allConfigs = await OtConfigModel.findAll();

        const calcResult = OtModel.calculateOtDetails(
          start_time,
          end_time,
          type || 1,
          allConfigs,
          holidayList
        );
        total = calcResult.total;
        details = calcResult.details;
      }

      // 3. Create OT Header
      const createdOt = await OtModel.create(
        {
          request_id: requestId,
          start_time: dayjs(start_time).format("YYYY-MM-DD HH:mm:ss"),
          end_time: dayjs(end_time).format("YYYY-MM-DD HH:mm:ss"),
          description,
          emp_id: emp_id || created_by,
          total,
          created_by,
        },
        conn
      );

      // 4. Create OT Details
      if (details.length > 0) {
        await OtDetailModel.createMany(createdOt.id, details, conn);
      }

      // 5. Create Approval Flow (ทำงานเฉพาะกรณีไม่ใช่ Draft หรือตามเงื่อนไขที่ต้องการ)
      // ถ้า sts != 0 คือกด Submit ให้สร้าง Flow เลย
      if (sts !== 0 && sts !== undefined) {
        // เช็คว่ามี leader_emp_id ไหม
        if (!leader_emp_id) {
          throw new Error(
            "ต้องระบุรหัสหัวหน้างาน (leader_emp_id) สำหรับการขออนุมัติ"
          );
        }
        await this.createApprovalFlow(
          requestId,
          { ...data, leader_emp_id },
          conn
        );
      }

      await conn.commit();
      return { ...createdOt, details, request_id: requestId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateOt(otId, data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const exists = await OtModel.findById(otId);
      if (!exists) throw new Error("OT not found");

      const { sts, start_time, end_time, description, type, created_by } = data;

      if (sts !== undefined && exists.request_id) {
        await OtModel.updateRequestStatus(exists.request_id, sts, null, conn);
      }

      let total = exists.total;
      let details = [];
      const isTimeChanged =
        (start_time && start_time !== exists.start_time) ||
        (end_time && end_time !== exists.end_time);

      if (isTimeChanged) {
        const holidayList = await HolidayModel.getHolidayDateList();
        const allConfigs = await OtConfigModel.findAll();
        const calcResult = OtModel.calculateOtDetails(
          start_time || exists.start_time,
          end_time || exists.end_time,
          type || exists.type || 1,
          allConfigs,
          holidayList
        );
        total = calcResult.total;
        details = calcResult.details;

        // ลบ Details เก่าแล้วลงใหม่
        // หมายเหตุ: ต้องตรวจสอบว่า OtDetailModel.removeByOtId มีหรือไม่ หรือใช้ query ตรงๆ
        await conn.query("DELETE FROM ot_detail WHERE ot_id = ?", [otId]);

        if (details.length > 0) {
          await OtDetailModel.createMany(otId, details, conn);
        }
      }

      await OtModel.update(
        otId,
        {
          ...exists,
          start_time: start_time
            ? dayjs(start_time).format("YYYY-MM-DD HH:mm:ss")
            : exists.start_time,
          end_time: end_time
            ? dayjs(end_time).format("YYYY-MM-DD HH:mm:ss")
            : exists.end_time,
          description: description ?? exists.description,
          total,
          created_by: created_by || exists.created_by,
        },
        conn
      );

      await conn.commit();
      return { id: otId, total, details };
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
        const { total, details } = OtModel.calculateOtDetails(
          otData.start_time,
          otData.end_time,
          1, // สมมติ type=1 (OT ปกติ)
          allConfigs,
          holidayList
        );

        // Update Details (ลบเก่า -> สร้างใหม่)
        if (details.length > 0) {
          await conn.query("DELETE FROM ot_detail WHERE ot_id = ?", [otData.id]);
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
        await OtModel.updateRequestStatus(reqId, 1, null, conn);

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
  }
};

export default OtService;
