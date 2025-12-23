import db from '../config/db.js';

const empTypes = {
    async findAll() {
        const sql = 'SELECT code, name, description FROM employee_types'
        const [rows] = await db.query(sql)
        return rows
    },

    async create(data) {
        const sql = 'INSERT INTO employee_types (code, name, description) VALUES (?, ?, ?)'

        const values = [
            data.code,
            data.name,
            data.description
        ];

        const [result] = await db.query(sql, values)
        return { id: result.insertId, ...data }
        
    }
}

export default empTypes