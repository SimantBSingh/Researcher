import { request } from './client';

export const getLinks = (projectId) =>
  request('GET', `/api/links/${projectId}/`);

export const createLink = (url, projectId) =>
  request('POST', '/api/links/', { url, project_id: projectId });

export const updateLink = (linkId, projectId, url, title) =>
  request('PUT', `/api/links/${linkId}/${projectId}`, { url, title, project_id: projectId });

export const deleteLink = (linkId, projectId) =>
  request('DELETE', `/api/links/${linkId}/${projectId}`);

export const reorderLinks = (projectId, linksOrder) =>
  request('PUT', '/api/links/reorder/', { project_id: projectId, links_order: linksOrder });
