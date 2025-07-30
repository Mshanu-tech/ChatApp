// src/utils/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://chatappbackend-eg0b.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  // Optional: you can add timeout or auth headers here
});

export default axiosInstance;
  