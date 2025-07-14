import { io } from 'socket.io-client';
export const socket = io('https://chatappbackend-eg0b.onrender.com/', {
  autoConnect: false,
});