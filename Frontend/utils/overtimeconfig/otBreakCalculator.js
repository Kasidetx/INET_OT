// utils/overtimeconfig/otBreakCalculator.js

export function calculateBreak({
  employeeType,
  workedHours,
  otPeriod
}) {

  const h = Number(workedHours || 0)
  const minutes = h * 60

  
   /*   นอกเวลา  ทุกประเภทกฎเดียว */
  
  if (otPeriod === 'ทำงานนอกเวลา') {
    return {
      breakMinutes: minutes >= 120 ? 30 : 0
    }
  }

       /*  ในเวลา */

/*    พนักงานปกติ */
  if (employeeType === 1) {
    return {
      breakMinutes: minutes >= 540 ? 60 : 0   // 9 ชม = 540 นาที
    }
  }

 /*   พนักงานเข้ากะปกติ */
  if (employeeType === 2) {
    if (minutes >= 360) return { breakMinutes: 60 } // 6 ชม
    if (minutes >= 330) return { breakMinutes: 30 } 
    return { breakMinutes: 0 }
  }

/*    พนักงานเข้ากะ 12 ชม */
  if (employeeType === 3) {
    if (minutes >= 720) return { breakMinutes: 90 } // 12 ชม
    if (minutes >= 690) return { breakMinutes: 90 } 
    if (minutes >= 360) return { breakMinutes: 60 }
     if (minutes >= 330) return { breakMinutes: 30 } 
    return { breakMinutes: 0 }
  }

  /*  พนักงานรายชั่วโมง  */
  if (employeeType === 4) {
    if (minutes >= 360) return { breakMinutes: 60 }
    if (minutes >= 330) return { breakMinutes: 30 }
    return { breakMinutes: 0 }
  }

  return { breakMinutes: 0 }
}
