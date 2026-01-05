// src/utils/response.js

export const sendResponse = (res, statusCode, data, message = null) => {
  const response = {
    status: "success",
    code: 1,
    message: message,
    result: data,
  };

  res.status(statusCode).json(response);
};