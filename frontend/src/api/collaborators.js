import { request } from './client';

export const getCollaborators = (projectId) =>
  request('GET', `/api/collaborators/${projectId}/`);

export const getAllCollaborators = (projectId) =>
  request('GET', `/api/collaborators/all/${projectId}/`);

export const createCollaborator = (collaborator) =>
  request('POST', '/api/collaborators/', collaborator);

export const updateCollaborator = (collaboratorId, collaborator) =>
  request('PUT', `/api/collaborators/${collaboratorId}/`, collaborator);

export const deleteCollaborator = (collaboratorEmail, projectId) =>
  request('DELETE', `/api/collaborators/${collaboratorEmail}/${projectId}`);

export const inviteCollaborator = (email, projectId) =>
  request('POST', '/api/collaborators/invite', { email, project_id: projectId });

export const correctCollaborators = (projectId) =>
  request('PUT', `/api/collaborators/correct/${projectId}`);
