import { request } from './client';

export const getProjects = () =>
  request('GET', '/api/projects/');

export const getSharedProjects = () =>
  request('GET', '/api/projects/shared');

export const createProject = (projectData) =>
  request('POST', '/api/projects/', projectData);

export const renameProject = (projectId, newName) =>
  request('PUT', `/api/projects/${projectId}/rename`, { new_name: newName });

export const deleteProject = (projectId) =>
  request('DELETE', `/api/projects/${projectId}`);

export const shareProject = (projectId, userEmail) =>
  request('PUT', `/api/projects/${projectId}/share`, { user_email: userEmail });

export const syncProjects = () =>
  request('POST', '/api/projects/sync/');

export const getSharedUsers = (projectId) =>
  request('GET', `/api/projects/shared_users/${projectId}`);

export const deleteSharedUser = (projectId, userEmail) =>
  request('DELETE', `/api/projects/${projectId}/delete_shared_users`, { user_email: userEmail });

export const updateAccessLevel = (projectId, sharedUserEmail, accessLevel) =>
  request('PUT', `/api/projects/${projectId}/access_level`, {
    shared_user_email: sharedUserEmail,
    access_level: accessLevel,
  });

export const getProjectAsFolder = (projectId) =>
  request('GET', `/api/projects/as_folder/${projectId}`);

export const getAccessLevel = (projectId) =>
  request('GET', `/api/projects/access_level/${projectId}`);

export const getAdminProjects = () =>
  request('GET', '/api/projects/admin');
