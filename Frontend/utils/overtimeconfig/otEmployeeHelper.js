export function getEmployeeTypeId(name = '') {
  if (name.includes('12')) return 3
  if (name.includes('กะ')) return 2
  if (name.includes('ชั่วโมง')) return 4
  return 1
}

export function getEmployeeTypeName(id) {
  const map = {
    1: 'พนักงานปกติ',
    2: 'พนักงานเข้ากะปกติ',
    3: 'พนักงานเข้ากะ12ชม',
    4: 'พนักงานรายชั่วโมง'
  }
  return map[id] || ''
}
