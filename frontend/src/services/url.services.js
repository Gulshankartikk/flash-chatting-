import axios from "axios";

// .env mein: REACT_APP_API_URL=http://localhost:8000  (no /api, no /auth)
const apiUrl = `${process.env.REACT_APP_API_URL}/api`;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 15000, // ✅ don't hang forever on a dead connection
});

// ✅ Session-expiry handling, centralised here instead of every caller
// having to check `err.response.status === 401` themselves. When the
// backend says the session/cookie is no longer valid, clear local auth
// state and bounce to login — exactly what WhatsApp Web does when it
// detects you've been logged out elsewhere.
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network down / CORS / server unreachable — axios gives no
    // `error.response` in this case, so surface a clear message instead
    // of letting callers dereference `err.response.data.message` on
    // `undefined` and crash.
    if (!error.response) {
      error.message = "Network error — check your connection and try again.";
      return Promise.reject(error);
    }

    if (error.response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;