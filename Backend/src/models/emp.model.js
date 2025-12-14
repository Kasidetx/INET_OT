import db from "../config/db.js";

const EmpModel = {
  
  async findAll() {
    const [rows] = await db.query(
        "SELECT e.id, e.emp_id, e.name, e.position, e.request, e.total_hour FROM  view_employee2 e ORDER BY id ASC"
    );
    return rows;
  },

};

export default EmpModel;
