import db from "../config/db.js";

const employee = {

    async findAll() {
        const sql = 'SELECT * FROM employee'
        const [rows] = await db.query(sql)
        return rows
    },

    async create(data) {
        const sql = 'INSERT INTO employee (emp_id, name, position) VALUES (?, ?, ?)'

        const values = [
            data.emp_id,
            data.name,
            data.position
        ];

        const [result] = await db.query(sql, values)
        return { id: result.insertId, ...data};
    }
}

export default employee;