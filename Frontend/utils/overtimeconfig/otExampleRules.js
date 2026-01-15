// otExampleRules.js
export function getExampleRules(form) {
  const type = (form.employeeTypeName || '').toLowerCase()
  const dayType = form.Worknametype || ''
  const period = form.otPeriod || ''

  const isHoliday = dayType.includes('หยุด')
  const isWorkday = dayType.includes('ทำงาน')
  const isDuring = period.includes('ในเวลา')
  const isOutside = period.includes('นอกเวลา')


  // ---------- พนักงานปกติ ----------
  if (type.includes('ปกติ')) {
    if (isWorkday && isDuring) {
      return [
        'พนักงานปกติ วันทำงาน (ในเวลา)',
        '(เงื่อนไข): -'
      ]
    }

    if (isWorkday && isOutside) {
      return [
        'พนักงานปกติ วันทำงาน (นอกเวลา)',
        ' (เงื่อนไข) หลังเลิกงาน: ทำงานเกิน 2 ชม. หักพัก 30 นาที, ก่อนเริ่มงาน: ไม่มีหักพัก'
      ]
    }

    if (isHoliday && isDuring) {
      return [
        'พนักงานปกติ วันหยุด (ในเวลา) ',
        `(เงื่อนไข) ทำงานต่อเนื่อง 5.30 ชม. หักพัก 30 นาที
         ทำงานต่อเนื่อง 6 ชม. หักพัก 1 ชม.`
      ]
    }

    if (isHoliday && isOutside) {
      return [
        'พนักงานปกติ วันหยุด (นอกเวลา): ทำงานครบ 9 ชม. หักพัก 1 ชม.',
        'หลังเลิกงาน: ทำงานเกิน 2 ชม. หักพัก 30 นาที'
      ]
    }
  }

  
  // ---------- เข้ากะปกติ ----------
  if (type.includes('เข้ากะปกติ')) {
    if (isWorkday && isDuring) {
      return [
        'พนักงานเข้ากะปกติ วันทำงาน (ในเวลา): ทำงานครบ 9 ชม. หักพัก 1 ชม.',
        '-'
      ]
    }

    if (isWorkday && isOutside) {
      return [
        'พนักงานเข้ากะปกติ วันทำงาน (นอกเวลา)',
        'ทำงานเกิน 2 ชม. หักพัก 30 นาที'
      ]
    }

    if (isHoliday && isDuring) {
      return [
        'พนักงานเข้ากะปกติ วันหยุด (ในเวลา)',
        'ทำงานต่อเนื่อง 5.30 ชม. หักพัก 30 นาที / 6 ชม. หักพัก 1 ชม.'
      ]
    }

    if (isHoliday && isOutside) {
      return [
        'พนักงานเข้ากะปกติ วันหยุด (นอกเวลา)',
        'ไม่มีหักพัก'
      ]
    }
  }

  // ---------- เข้ากะ 12 ชม ----------
  if (type.includes('12')) {
    if (isWorkday && isDuring) {
      return [
        'พนักงานเข้ากะ 12 ชม. วันทำงาน',
        'ทำงานครบ 12 ชม. หักพัก 1 ชม. 30 นาที'
      ]
    }

    if (isWorkday && isOutside) {
      return [
        'พนักงานเข้ากะ 12 ชม. วันทำงาน (นอกเวลา)',
        'ทำงานเกิน 2 ชม. หักพัก 30 นาที'
      ]
    }

    if (isHoliday) {
      return [
        'พนักงานเข้ากะ 12 ชม. วันหยุด',
        'ไม่มีหักพัก'
      ]
    }
  }

  // ---------- รายชั่วโมง ----------
  if (type.includes('ชั่วโมง')) {
    return [
      'พนักงานรายชั่วโมง',
      'คิดตามเวลาทำงานจริง'
    ]
  }

  return []
}
