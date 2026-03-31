import { request } from './client';

export const getTemplates = () =>
  request('GET', '/api/templates/');

export const createTemplate = (templateData) =>
  request('POST', '/api/templates/', templateData);

export const updateTemplate = (encodedOriginalName, templateData) =>
  request('PUT', `/api/templates/${encodedOriginalName}`, templateData);

export const deleteTemplate = (templateId) =>
  request('DELETE', `/api/templates/${templateId}`);

export const getTemplateByName = (templateName) =>
  request('GET', `/api/templates/name/${encodeURIComponent(templateName)}`);

export const getTemplateFolders = (parentFolderId) =>
  request('GET', `/api/get_template_folders/${parentFolderId}`);
