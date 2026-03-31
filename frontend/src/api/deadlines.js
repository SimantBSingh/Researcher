import { request } from './client';

export const getDeadlines = (projectId) =>
  request('GET', `/api/deadlines/${projectId}/`);

export const createDeadline = (deadline) =>
  request('POST', '/api/deadlines/', deadline);

export const updateDeadline = (deadlineId, deadline) =>
  request('PUT', `/api/deadlines/${deadlineId}/`, deadline);

export const deleteDeadline = (deadlineId, projectId) =>
  request('DELETE', `/api/deadlines/${deadlineId}/${projectId}`);
