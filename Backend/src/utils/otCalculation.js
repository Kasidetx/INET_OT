// src/utils/otCalculation.js
import dayjs from "dayjs";
import { WORK_TIME, DAY_TYPE, OT_PERIOD } from "../config/constants.js";

// --- Helper Functions ---

const getOtPeriod = (cursor, workStart, workEnd) => {
  if (cursor.isBefore(workStart)) return OT_PERIOD.BEFORE;
  if (cursor.isBefore(workEnd)) return OT_PERIOD.DURING;
  return OT_PERIOD.AFTER;
};

const getWorkHours = (dateObj, workdayConfigs) => {
  if (workdayConfigs && workdayConfigs.length > 0) {
    const dayIndex = dateObj.day(); // 0-6
    const config = workdayConfigs.find((cfg) => {
      const days = (cfg.work_day || "")
        .split(",")
        .map((d) => parseInt(d.trim()));
      return days.includes(dayIndex);
    });
    if (config && config.start_time && config.end_time) {
      return {
        start: config.start_time,
        end: config.end_time,
      };
    }
  }
  return { start: WORK_TIME.START, end: WORK_TIME.END };
};

const getDayType = (dateObj, holidayList, workdayConfigs) => {
  const isPublicHoliday = holidayList.includes(dateObj.format("YYYY-MM-DD"));
  if (isPublicHoliday) return DAY_TYPE.HOLIDAY;

  if (workdayConfigs && workdayConfigs.length > 0) {
    const dayIndex = dateObj.day();
    const config = workdayConfigs.find((cfg) => {
      const days = (cfg.work_day || "")
        .split(",")
        .map((d) => parseInt(d.trim()));
      return days.includes(dayIndex);
    });
    if (config && parseFloat(config.work_hour) > 0) {
      return DAY_TYPE.WORKDAY;
    }
    return DAY_TYPE.HOLIDAY;
  }
  // Fallback (เผื่อไม่มี config)
  const isWeekend = [0, 6].includes(dateObj.day());
  return isWeekend ? DAY_TYPE.HOLIDAY : DAY_TYPE.WORKDAY;
};

const BreakStrategies = {
  // กลยุทธ์แบบขั้นบันได (Step Deduction) สำหรับวันหยุด
  STEP_DEDUCTION: (duration, empTypeId) => {
    // กฎพิเศษสำหรับกะ 12 ชม.
    if (empTypeId == EMP_TYPE.SHIFT_12) {
      if (duration >= 11.5) return 90;
      if (duration >= 6.0) return 60;
      if (duration >= 5.5) return 30;
      return 0;
    }
    // กฎสำหรับพนักงานทั่วไป
    if (duration >= 6.0) return 60;
    if (duration >= 5.5) return 30;
    return 0;
  },

  // กลยุทธ์แบบคงที่ (Fixed Deduction) ตาม Config DB
  FIXED_DEDUCTION: (duration, config) => {
    const minHours = parseFloat(config.min_continuous_hours);
    const breakMins = parseInt(config.break_minutes);
    if (duration >= minHours) return breakMins;
    return 0;
  },
};

// ✅ [เพิ่มส่วนที่หายไป] ฟังก์ชันคำนวณหักเวลาพัก
const _calculateNetHours = (duration, config) => {
  if (!config || config.require_break != 1) return duration;

  let minutesToDeduct = 0;

  // เลือกใช้ Strategy ตามเงื่อนไข
  if (config.day_type === "HOLIDAY" && config.ot_period === "DURING_WORK") {
    minutesToDeduct = BreakStrategies.STEP_DEDUCTION(
      duration,
      config.employee_type_id
    );
  } else {
    minutesToDeduct = BreakStrategies.FIXED_DEDUCTION(duration, config);
  }

  const deductionInHours = minutesToDeduct / 60.0;
  return Math.max(0, parseFloat((duration - deductionInHours).toFixed(2)));
};

export const generateNextDocNo = (lastDocNo) => {
  if (!lastDocNo) return "OT-1";
  const parts = lastDocNo.split("-");
  if (parts.length < 2) return "OT-1";
  const numberPart = parseInt(parts[1], 10);
  if (isNaN(numberPart)) return "OT-1";
  return `OT-${numberPart + 1}`;
};

// --- Main Function ---

export const calculateOtDetails = (
  startStr,
  endStr,
  typeId,
  allConfigs,
  holidayList,
  workdayConfigs
) => {
  const reqStart = dayjs(startStr);
  const reqEnd = dayjs(endStr);
  if (reqEnd.isBefore(reqStart))
    throw new Error("End time must be after start time");

  const dateStr = reqStart.format("YYYY-MM-DD");
  const { start: workStart, end: workEnd } = getWorkHours(
    reqStart,
    workdayConfigs
  );

  const workStartBound = dayjs(`${dateStr} ${workStart}`);
  const workEndBound = dayjs(`${dateStr} ${workEnd}`);
  const currentDayType = getDayType(reqStart, holidayList, workdayConfigs);

  let currentCursor = reqStart;
  const detailsToInsert = [];
  let grandTotalHours = 0;

  while (currentCursor.isBefore(reqEnd)) {
    const period = getOtPeriod(currentCursor, workStartBound, workEndBound); // ใช้ Helper ในไฟล์
    let nextCursor = reqEnd;

    // Time Slicing logic
    if (period === OT_PERIOD.BEFORE) {
      nextCursor = reqEnd.isBefore(workStartBound) ? reqEnd : workStartBound;
    } else if (period === OT_PERIOD.DURING) {
      nextCursor = reqEnd.isBefore(workEndBound) ? reqEnd : workEndBound;
    }

    let dbPeriod = period;
    if (period === "BEFORE_WORK" || period === "AFTER_WORK") {
      dbPeriod = "OUTSIDE_WORK";
    }

    // ✅ CHECK Logic: Type 1 ห้ามคิดในเวลางาน
    if (
      typeId === 1 &&
      currentDayType === "WORKDAY" &&
      dbPeriod === "DURING_WORK"
    ) {
      currentCursor = nextCursor;
      continue;
    }

    const segmentDuration = nextCursor.diff(currentCursor, "minute") / 60.0;

    if (segmentDuration > 0) {
      // 1. ค้นหา Config ที่ตรงเงื่อนไข และต้องเป็น Active (1) เท่านั้น
      const matchedConfig = allConfigs.find(
        (cfg) =>
          cfg.employee_type_id == typeId &&
          cfg.day_type === currentDayType &&
          cfg.ot_period === dbPeriod &&
          cfg.is_active === 1 // ✅ เพิ่มบรรทัดนี้: ต้องเปิดใช้งานเท่านั้น
      );

      // 2. ถ้าเจอ Config ให้คำนวณ / ถ้าไม่เจอ (matchedConfig เป็น undefined) ให้ข้ามไปเลย
      if (matchedConfig) {
        // ใช้ Config ที่เจอมาคำนวณหักเวลาพัก
        const netHours = _calculateNetHours(segmentDuration, matchedConfig);

        if (netHours > 0) {
          detailsToInsert.push({
            ot_start_time: currentCursor.format("YYYY-MM-DD HH:mm:ss"),
            ot_end_time: nextCursor.format("YYYY-MM-DD HH:mm:ss"),
            ot_hour: netHours,
            ot_rate: matchedConfig.rate, // ใช้ Rate จาก Config
          });
          grandTotalHours += netHours;
        }
      }
      // ❌ ลบส่วน else หรือ fallback ที่ให้ค่า rate: 1.0 ทิ้งไป
      // แปลว่าถ้าปิด Config -> matchedConfig = undefined -> ไม่เข้า if -> ไม่บันทึกข้อมูล
    }
    currentCursor = nextCursor;
  }

  return {
    total: parseFloat(grandTotalHours.toFixed(2)),
    details: detailsToInsert,
  };
};
