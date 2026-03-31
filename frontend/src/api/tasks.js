import { request } from './client';

export const getTasks = (projectId) =>
  request('GET', `/api/tasks/${projectId}/`);

export const createTask = (task) =>
  request('POST', '/api/tasks/', task);

export const updateTask = (taskId, body) =>
  request('PUT', `/api/tasks/${taskId}/`, body);

export const deleteTask = (taskId, projectId) =>
  request('DELETE', `/api/tasks/${taskId}/${projectId}`);
