import dayjs from "dayjs";
import {DAY_TYPE, OT_PERIOD } from "../config/constants.js";

// ==========================================
// Helper Functions
// ==========================================

/**
 * หาช่วงเวลาว่าอยู่ในช่วงไหน (ก่อนงาน/ในงาน/หลังงาน)
 */
const getOtPeriod = (cursor, workStart, workEnd) => {
  if (cursor.isBefore(workStart)) return OT_PERIOD.BEFORE;
  if (cursor.isBefore(workEnd)) return OT_PERIOD.DURING;
  return OT_PERIOD.AFTER;
};

/**
 * ดึงเวลาเริ่ม-จบงาน จาก Workday Config
 */
const getWorkHours = (dateObj, workdayConfigs) => {
  if (workdayConfigs?.length > 0) {
    const dayIndex = dateObj.day(); // 0-6
    const config = workdayConfigs.find((cfg) => {
      const days = (cfg.work_day || "")
        .split(",")
        .map((d) => parseInt(d.trim()));
      return days.includes(dayIndex);
    });

    if (config?.start_time && config?.end_time) {
      return { start: config.start_time, end: config.end_time };
    }
  }
};

/**
 * ตรวจสอบว่าเป็นวันหยุดหรือวันทำงาน
 */
const getDayType = (dateObj, holidayList, workdayConfigs) => {
  const dateString = dateObj.format("YYYY-MM-DD");

  // 1. เช็ควันหยุดนักขัตฤกษ์
  if (holidayList.includes(dateString)) return DAY_TYPE.HOLIDAY;

  // 2. เช็คตารางวันทำงาน
  if (workdayConfigs?.length > 0) {
    const dayIndex = dateObj.day();
    const config = workdayConfigs.find((cfg) => {
      const days = (cfg.work_day || "")
        .split(",")
        .map((d) => parseInt(d.trim()));
      return days.includes(dayIndex);
    });

    // ถ้ามี config และชั่วโมงงาน > 0 ถือเป็นวันทำงาน
    if (config && parseFloat(config.work_hour) > 0) {
      return DAY_TYPE.WORKDAY;
    }
    return DAY_TYPE.HOLIDAY;
  }

  // 3. Fallback (เสาร์-อาทิตย์ หยุด)
  const isWeekend = [0, 6].includes(dateObj.day());
  return isWeekend ? DAY_TYPE.HOLIDAY : DAY_TYPE.WORKDAY;
};

// ==========================================
// Break Strategies (Logic การหักเวลาพัก)
// ==========================================
const BreakStrategies = {
  // แบบขั้นบันได (สำหรับวันหยุด)
  STEP_DEDUCTION: (duration, empTypeId) => {
    // กะ 12 ชม.
    if (empTypeId == 3) {
      // 3 = SHIFT_12
      if (duration >= 11.5) return 90;
      if (duration >= 6.0) return 60;
      if (duration >= 5.5) return 30;
      return 0;
    }
    // พนักงานทั่วไป
    if (duration >= 6.0) return 60;
    if (duration >= 5.5) return 30;
    return 0;
  },

  // แบบคงที่ (ตาม Config DB)
  FIXED_DEDUCTION: (duration, config) => {
    const minHours = parseFloat(config.min_continuous_hours);
    const breakMins = parseInt(config.break_minutes);
    return duration >= minHours ? breakMins : 0;
  },
};

const _calculateNetHours = (duration, config) => {
  if (!config || config.require_break != 1) return duration;

  let minutesToDeduct = 0;

  if (config.day_type === "HOLIDAY" && config.ot_period === "DURING_WORK") {
    minutesToDeduct = BreakStrategies.STEP_DEDUCTION(
      duration,
      config.employee_type_id
    );
  } else {
    minutesToDeduct = BreakStrategies.FIXED_DEDUCTION(duration, config);
  }

  const deductionInHours = minutesToDeduct / 60.0;
  // ป้องกันค่าติดลบ
  return Math.max(0, parseFloat((duration - deductionInHours).toFixed(2)));
};

// ==========================================
// Main Function
// ==========================================
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

  // เตรียมข้อมูลวันทำงาน
  const dateStr = reqStart.format("YYYY-MM-DD");
  const { start: workStart, end: workEnd } = getWorkHours(
    reqStart,
    workdayConfigs
  );
  const workStartBound = dayjs(`${dateStr} ${workStart}`);
  const workEndBound = dayjs(`${dateStr} ${workEnd}`);

  const currentDayType = getDayType(reqStart, holidayList, workdayConfigs);
  const detailsToInsert = [];

  let currentCursor = reqStart;
  let grandTotalHours = 0;

  while (currentCursor.isBefore(reqEnd)) {
    const period = getOtPeriod(currentCursor, workStartBound, workEndBound);
    let nextCursor = reqEnd;

    if (period === OT_PERIOD.BEFORE) {
      nextCursor = reqEnd.isBefore(workStartBound) ? reqEnd : workStartBound;
    } else if (period === OT_PERIOD.DURING) {
      nextCursor = reqEnd.isBefore(workEndBound) ? reqEnd : workEndBound;
    }

    const segmentDuration = nextCursor.diff(currentCursor, "minute") / 60.0;

    if (segmentDuration > 0) {
      const matchedConfig = allConfigs.find(
        (cfg) =>
          cfg.employee_type_id == typeId &&
          cfg.day_type === currentDayType &&
          cfg.ot_period === period &&
          cfg.is_active === 1
      );

      if (matchedConfig) {
        const netHours = _calculateNetHours(segmentDuration, matchedConfig);

        if (netHours > 0) {
          detailsToInsert.push({
            ot_start_time: currentCursor.format("YYYY-MM-DD HH:mm:ss"),
            ot_end_time: nextCursor.format("YYYY-MM-DD HH:mm:ss"),
            ot_hour: netHours,
            ot_rate: matchedConfig.rate,
          });
          grandTotalHours += netHours;
        }
      }
    }

    currentCursor = nextCursor;
  }

  return {
    total: parseFloat(grandTotalHours.toFixed(2)),
    details: detailsToInsert,
  };
};
