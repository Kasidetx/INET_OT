// ใช้คลุม Async Function เพื่อไม่ต้องเขียน try-catch ซ้ำๆ
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
