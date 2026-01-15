export function suggestRate(form) {
  const isHoliday = form.Worknametype.includes('หยุด')
  const isDuringWork = form.otPeriod.includes('ใน')
  const isOutsideWork = form.otPeriod.includes('นอก')

  if (isHoliday) {
    if (isDuringWork) return 1.0
    if (isOutsideWork) return 3.0
    return 1.0
  }

  if (isDuringWork) return 1.0
  if (isOutsideWork) return 1.5
  return 1.0
}
