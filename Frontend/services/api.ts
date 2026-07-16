// api.ts
import axios from 'axios';

const API = axios.create({
  baseURL: '/myapp', // Keeping your Vite proxy setup
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the Access Token to every outgoing request automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Catch 401 errors and silently refresh the token
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and we haven't tried to retry yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // SimpleJWT names it 'refresh' by default. Make sure your onLoginSuccess saves this!
        const refreshToken = localStorage.getItem('refreshToken'); 

        if (!refreshToken) {
          return Promise.reject(error);
        }

        // Ask Django for a new token using the full URL to bypass proxy if needed
        const response = await axios.post('http://127.0.0.1:8000/auth/refresh/', {
          refresh: refreshToken,
        });

        // Save the new access token
        const newAccessToken = response.data.access;
        localStorage.setItem('accessToken', newAccessToken);

        // Update the failed request with the new token and try again
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return API(originalRequest);

      } catch (refreshError) {
        // If the refresh token itself is dead, log them out completely
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;