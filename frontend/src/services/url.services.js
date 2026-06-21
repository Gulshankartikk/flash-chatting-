import axios from "axios";

// Make sure your .env has something like:
// REACT_APP_API_URL=http://localhost:8000/api/auth
const apiUrl = process.env.REACT_APP_API_URL;

const axiosInstance = axios.create({
  baseURL: apiUrl, // axios config key is `baseURL`, capital URL
  withCredentials: true, // capital C — required for the auth_token cookie to be sent/received
});

export default axiosInstance;