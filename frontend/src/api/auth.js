import { request, requestNoAuth } from './client';
import { apiUrl } from '../helpers/getApiUrl';

export const login = (credentials) =>
  requestNoAuth('POST', '/auth/login', credentials);

export const getInviteEmail = async (token) => {
  const response = await fetch(`${apiUrl}/auth/invite?token=${token}`);
  const data = await response.json();
  return { response, data };
};

export const signup = (userData) =>
  requestNoAuth('POST', '/auth/signup', userData);

export const signupInvite = (userData) =>
  requestNoAuth('POST', '/auth/signup/invite', userData);

export const sendVerificationCode = (email) =>
  requestNoAuth('POST', '/auth/send-verification', { email });

export const updateProfile = (profileData) =>
  request('PUT', '/auth/profile', profileData);
