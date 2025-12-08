import axios from "axios";

const api = axios.create({
  baseURL: process.env.NUXT_ENV_BACKEND_URL,
  timeout: 15000,
});

export default api;
