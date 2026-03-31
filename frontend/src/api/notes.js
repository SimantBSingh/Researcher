import { request } from './client';

export const getNotes = (projectId) =>
  request('GET', `/api/notes/${projectId}/`);

export const createNote = (content, projectId) =>
  request('POST', '/api/notes/', { content, project_id: projectId });

export const updateNote = (noteId, content, projectId) =>
  request('PUT', `/api/notes/${noteId}/`, { content, project_id: projectId });

export const deleteNote = (noteId, projectId) =>
  request('DELETE', `/api/notes/${noteId}/${projectId}`);
