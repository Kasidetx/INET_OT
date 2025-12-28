export const sendResponse = (res, statusCode, data, message = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
