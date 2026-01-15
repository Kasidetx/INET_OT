// helpers/otBreakCalculator.js

// 🔹 helper ภายในไฟล์ (ไม่ต้อง export ก็ได้)
function hoursToMinutes(value) {
  if (typeof value === 'number') {
    return Math.round(value * 60)
  }

  if (typeof value === 'string' && value.includes('.')) {
    const [h, m] = value.split('.')
    return Number(h) * 60 + Number(m)
  }

  return Number(value) * 60
}

/**
 * @param {Object}
 * @param {number} employeeType   1-4
 * @param {number|string} workedHours  เช่น 5.30, 5.5, 6
 * @param {string} otPeriod       'ทำงานในเวลา' | 'ทำงานนอกเวลา'
 * @param {string} otContext      'AFTER_WORK' | 'BEFORE_WORK'
 */
export function calculateBreak({
  employeeType,
  workedHours,
  otPeriod,
  otContext
}) {
  if (!workedHours || workedHours <= 0) {
    return { breakMinutes: 0 }
  }

  const totalMinutes = hoursToMinutes(workedHours)
  let breakMinutes = 0

  // -------------------------
  // ✅ OT นอกเวลา
  // -------------------------
  if (otPeriod === 'ทำงานนอกเวลา') {
    if (otContext === 'AFTER_WORK' && totalMinutes >= 120) {
      return { breakMinutes: 30 }
    }
    return { breakMinutes: 0 }
  }

  // -------------------------
  // ✅ ทำงานในเวลา
  // -------------------------

  // พนักงานปกติ / กะปกติ
  if (employeeType === 1 || employeeType === 2) {
    if (totalMinutes >= 360) breakMinutes = 60
    else if (totalMinutes >= 330) breakMinutes = 30
  }

  // กะ 12 ชม
  if (employeeType === 3) {
    if (totalMinutes >= 720) breakMinutes = 90
    else if (totalMinutes >= 360) breakMinutes = 60
  }

  // รายชั่วโมง
  if (employeeType === 4) {
    if (totalMinutes >= 360) breakMinutes = 60
    else if (totalMinutes >= 330) breakMinutes = 30
  }

  return { breakMinutes }
}
