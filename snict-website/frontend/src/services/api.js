import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://backend.snict.net/api",

  // Required for HTTP-only authentication cookie
  withCredentials: true,

  // Don't force JSON globally.
  // Axios will automatically set multipart/form-data
  // when FormData is used for image uploads.
  headers: {
    Accept: "application/json",
  },
});

// =========================================================
// ATTACH AUTH TOKEN
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("snict_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    // =====================================================
    // ADD BEARER TOKEN IF AVAILABLE
    // =====================================================

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================
// HANDLE AUTH ERRORS
// =========================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Authentication expired or missing."
      );
    }

    return Promise.reject(error);
  }
);

export default api;