import { getEmployeeTypeId } from './otEmployeeHelper'

export function getExampleRules(form) {
  const empType = getEmployeeTypeId(form.employeeTypeName)
  const period = form.otPeriod || ''
  const hours = Number(form.min_continuousHours || 0)

  const lines = []

 
  lines.push(`${form.employeeTypeName || 'พนักงาน'} ${form.Worknametype || ''} (${period})`)

        /*  นอกเวลา */
  if (period === 'ทำงานนอกเวลา') {
    lines.push('เงื่อนไข: ทำงานเกิน 2 ชม. หักพัก 30 นาที')
    lines.push(
      hours >= 2
        ? `→ ทำงาน ${hours} ชม. หักพัก 30 นาที`
        : `→ ทำงาน ${hours} ชม. ยังไม่เข้าเงื่อนไขพัก`
    )
    return lines
  }

          /* ในเวลา*/
  if (empType === 1) {
    lines.push('เงื่อนไข: ทำงานครบ 9 ชม. หักพัก 1 ชม.')
    lines.push(
      hours >= 9
        ? `→ ทำงาน ${hours} ชม. หักพัก 1 ชม.`
        : `→ ทำงาน ${hours} ชม. ยังไม่เข้าเงื่อนไขพัก`
    )
  }

  if (empType === 2 || empType === 4) {
    lines.push('เงื่อนไข:')
    lines.push('- 5.30 ชม. พัก 30 นาที')
    lines.push('- 6.00 ชม. พัก 1 ชม.')

    if (hours >= 6)
      lines.push(`→ ทำงาน ${hours} ชม. หักพัก 1 ชม.`)
    else if (hours >= 5.5)
      lines.push(`→ ทำงาน ${hours} ชม. หักพัก 30 นาที`)
    else
      lines.push(`→ ทำงาน ${hours} ชม. ยังไม่เข้าเงื่อนไขพัก`)
  }

  if (empType === 3) {
    lines.push('เงื่อนไข:')
    lines.push('- 11.30 ชม. พัก 1 ชม. 30 นาที')
    lines.push('- 12.00 ชม. พัก 1 ชม. 30 นาที')

    if (hours >= 11.5)
      lines.push(`→ ทำงาน ${hours} ชม. หักพัก 1 ชม. 30 นาที`)
    else if (hours >= 6)
      lines.push(`→ ทำงาน ${hours} ชม. หักพัก 1 ชม.`)
    else
      lines.push(`→ ทำงาน ${hours} ชม. ยังไม่เข้าเงื่อนไขพัก`)
  }

  return lines
}
