import axios from 'axios';
import { authAtom } from '../context/auth.ts';
import { getDefaultStore } from 'jotai';

const store = getDefaultStore();

const api = axios.create({
  baseURL: 'http://localhost:80/api/',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const auth = store.get(authAtom);
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await api.post('/auth/refresh');
        const newAccessToken = res.data.token;

        const auth = store.get(authAtom);
        store.set(authAtom, { ...auth, token: newAccessToken });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// User service
export const userService = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((res) => res.data),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((res) => res.data),
  refreshToken: () =>
    api.post('/auth/refresh').then((res) => res.data),
};

// Chat service
export const chatService = {
  getMessages: (conversationId: string) =>
    api.get(`/chat/messages/${conversationId}`).then((res) => res.data),
  createConversation: (data: { type: string; name: string; user_ids: string[] }) =>
    api.post('/chat/conversation', data).then((res) => res.data),
  sendMessage: (data: { conversationId: string; content: string }) =>
    api.post('/chat/messages', data).then((res) => res.data),
  getAllConversations: () =>
    api.get('/chat/conversations').then((res) => res.data),
};
