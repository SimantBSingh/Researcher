import { apiUrl } from '../helpers/getApiUrl';

const getToken = () => localStorage.getItem('access_token');

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

export async function request(method, path, body = null, extraHeaders = {}) {
  const options = {
    method,
    headers: { ...authHeaders(), ...extraHeaders },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${apiUrl}${path}`, options);
  const data = await response.json();
  return { response, data };
}

export async function requestNoAuth(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${apiUrl}${path}`, options);
  const data = await response.json();
  return { response, data };
}
