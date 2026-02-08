import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// IMPORTANT: Replace with your actual backend URL
const BASE_URL = 'http://localhost:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            // Handle token expiration/invalid token
            await AsyncStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
    }
);

export default api;
