export const sendResponse = (res, statusCode, data, message = null) => {
  res.status(statusCode).json({
    success: true,
    if (message) {
        message
    },
    data,
  });
};
