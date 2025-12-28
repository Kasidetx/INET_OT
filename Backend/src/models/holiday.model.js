import db from "../config/db.js";
import dayjs from "dayjs";

const HolidayModel = {
  async findAll() {
    const sql = "SELECT * FROM holiday ORDER BY day_date ASC";
    const [rows] = await db.query(sql);
    return rows;
  },

  async findByYear(year) {
    const sql = "SELECT * FROM holiday WHERE year = ?";
    const [rows] = await db.query(sql, [year]);
    return rows;
  },

  // ✅ เพิ่มฟังก์ชันนี้: คืนค่าเป็น Array ของ String ['2025-01-01', ...]
  async getHolidayDateList() {
    const rows = await this.findAll();
    return rows.map((h) => dayjs(h.day_date).format("YYYY-MM-DD"));
  },
};

export default HolidayModel;
