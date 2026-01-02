export const sendResponse = (res, statusCode, data, message = null) => {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};
