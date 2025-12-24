// src/models/holiday.model.js
import db from '../config/db.js';

const HolidayModel = {
    // ดึงรายการวันหยุดทั้งหมด
    async findAll() {
        // เรียงตามวันที่ เพื่อความง่ายในการดู
        const sql = 'SELECT * FROM holiday ORDER BY day_date ASC';
        const [rows] = await db.query(sql);
        return rows;
    },
    
    // (Optional) ดึงเฉพาะปีที่ต้องการ ถ้าข้อมูลเยอะมาก
    async findByYear(year) {
        const sql = 'SELECT * FROM holiday WHERE year = ?';
        const [rows] = await db.query(sql, [year]);
        return rows;
    }
};

export default HolidayModel;