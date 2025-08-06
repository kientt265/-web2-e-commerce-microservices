import axios from 'axios';
import { authAtom } from '../context/auth.ts';
import { getDefaultStore } from 'jotai';

const store = getDefaultStore();

const api = axios.create({
  baseURL: 'http://localhost:80/api/', 
});

api.interceptors.request.use((config) => {
  const auth = store.get(authAtom);
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

export const userService = {
    login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((res) => res.data),
    register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((res) => res.data),

}