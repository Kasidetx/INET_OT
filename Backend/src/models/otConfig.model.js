import db from '../config/db.js';

// 1. พนักงานทำงานเวลาปกติ
// 2. พนักงานเข้ากะทำงานปกติ
// 3. พนักงานทำงานกะ 12 ชั่วโมง
// 4. พนักงานทำงานตามชั่วโมง

const OtConfigModel = {
    async findAll() {
       
    },


    async findById(id) {
        const [rows] = await db.query('SELECT * FROM ot_config WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async create(data) {
        const sql = `
      INSERT INTO ot_config (description, type_work_id, start_time, end_time, rate, hour, deduction_min, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const values = [
            data.description,
            data.type_work_id,
            data.start_time,
            data.end_time,
            data.rate || 1.00,
            data.hour || null,
            data.deduction_min || 0,
            data.is_active !== undefined ? data.is_active : 1
        ];

        const [result] = await db.query(sql, values);
        return { id: result.insertId, ...data };
    },

    async update(id, data) {
        const sql = `
      UPDATE ot_config
      SET description = ?, type_work_id = ?, start_time = ?, end_time = ?, rate = ?, hour = ?, deduction_min = ?, is_active = ?
      WHERE id = ?
    `;
        const values = [
            data.description,
            data.type_work_id,
            data.start_time,
            data.end_time,
            data.rate || 1.00,
            data.hour || null,
            data.deduction_min || 0,
            data.is_active !== undefined ? data.is_active : 1,
            id
        ];

        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    },

    async remove(id) {
        const [result] = await db.query('DELETE FROM ot_config WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

export default OtConfigModel;
