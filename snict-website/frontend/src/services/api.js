import axios from "axios";

const api = axios.create({
  // LOCAL BACKEND
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://snict-backend.onrender.com/api",

  // Required for HTTP-only authentication cookies
  withCredentials: true,

  headers: {
    Accept: "application/json",
  },
});

export default api;