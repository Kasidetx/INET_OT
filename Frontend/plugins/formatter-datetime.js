export default ({ app }, inject) => {
  // ✅ 1. เพิ่มฟังก์ชันช่วยแปลง Date String จาก SQL
  const parseSQLDate = (isoDate) => {
    if (!isoDate) return null;
    // ถ้าเป็น string และมีเว้นวรรค ให้แทนที่ด้วย T เพื่อให้ JS อ่านได้
    if (typeof isoDate === "string") {
      return new Date(isoDate.replace(" ", "T"));
    }
    return new Date(isoDate);
  };

  // ✅ 2. แก้ไข formatDate ให้เรียกใช้ parseSQLDate
  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    const date = parseSQLDate(isoDate); // ใช้ตัวช่วยแปลง
    if (!date || isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // ✅ 3. แก้ไข formatTime ให้เรียกใช้ parseSQLDate
  const formatTime = (isoDate) => {
    if (!isoDate) return "-";
    const date = parseSQLDate(isoDate); // ใช้ตัวช่วยแปลง
    if (!date || isNaN(date.getTime())) return "-";

    const timeStr = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${timeStr} น.`;
  };

  // ✅ 4. แก้ไข formatDateTime
  const formatDateTime = (isoDate) => {
    if (!isoDate) return "-";
    // เรียกใช้ฟังก์ชันที่เราแก้แล้วข้างบน
    const d = formatDate(isoDate);
    const t = formatTime(isoDate);
    if (d === "-" || t === "-") return "-";
    return `${d} ${t}`;
  };

  inject("formatDate", formatDate);
  inject("formatTime", formatTime);
  inject("formatDateTime", formatDateTime);
};
