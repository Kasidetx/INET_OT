// src/middlewares/error.middleware.js

export const globalErrorHandler = (err, req, res, next) => {
  console.error("ERROR :", err); // ดู Log ฝั่ง Server

  // 1. ถ้าไม่มี statusCode ให้ถือว่าเป็น 500
  const statusCode = err.statusCode || 500;

  // 2. ปรับปรุงการดึง Message: 
  // ถ้าเป็น Database Error มักจะมี err.sqlMessage หรือ err.code
  let message = err.message || "Internal Server Error";
  
  // เสริม: ถ้าเป็น Error เชื่อมต่อฐานข้อมูล (ECONNREFUSED) ให้บอกชัดเจน
  if (err.code === 'ECONNREFUSED') {
    message = "Database Connection Error)";
  } else if (err.sqlMessage) {
    message = err.sqlMessage; // กรณี Error จาก SQL query โดยตรง
  }

  // 3. ส่ง Response ตาม Format ที่คุณต้องการ
  res.status(statusCode).json({
    status: "failed",
    code: 0,
    message: message,
    // (Optional) ส่ง debugCode ไปด้วยเผื่อใช้แก้บั๊ก (ควรปิดตอนขึ้น Production)
    debugCode: err.code 
  });
};