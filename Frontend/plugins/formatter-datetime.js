export default ({ app }, inject) => {
  // ฟังก์ชันแปลงวันที่ (เช่น 24/12/2568)
  const formatDate = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    // ตรวจสอบว่าเป็นวันที่ Valid หรือไม่
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // ฟังก์ชันแปลงเวลา (เช่น 15:30 น.)
  const formatTime = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '-';

    // ตัดวินาทีออก เอาแค่ HH:mm
    const timeStr = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24 ชั่วโมง
    });
    
    return `${timeStr} น.`;
  };

  // ฟังก์ชันรวม วันที่ + เวลา
  const formatDateTime = (isoDate) => {
    if (!isoDate) return '-';
    return `${formatDate(isoDate)} ${formatTime(isoDate)}`;
  };

  // Inject เข้าไปใน Vue Instance (เรียกใช้ด้วย this.$ชื่อ)
  inject('formatDate', formatDate);
  inject('formatTime', formatTime);
  inject('formatDateTime', formatDateTime);
};