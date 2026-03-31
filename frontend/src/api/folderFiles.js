import { request } from './client';
import { apiUrl } from '../helpers/getApiUrl';

export const getProjectRootContents = (projectId) =>
  request('GET', `/api/folder_file/project_root_contents/${projectId}`);

export const getFolderContents = (folderId) =>
  request('GET', `/api/folder_file/folder_contents/${folderId}`);

export const getFolders = (parentFolderId) => {
  const params = parentFolderId ? `?parent_folder_id=${parentFolderId}` : '';
  return request('GET', `/api/folder_file/folders/${params}`);
};

export const createFolder = (projectId, currentFolderId, folderName) =>
  request(
    'POST',
    `/api/folder_file/folders/${projectId}?folder_id=${currentFolderId}&new_folder_name=${encodeURIComponent(folderName)}`
  );

export const deleteDocument = (documentType, projectId, documentId) =>
  request('DELETE', `/api/folder_file/${documentType}s/${projectId}/${documentId}`);

export const editDocument = (documentType, documentId, name, projectId) =>
  request('PUT', `/api/folder_file/${documentType}s/${documentId}`, { name, project_id: projectId });

export const getFiles = (folderId) =>
  request('GET', `/api/folder_file/files/${folderId}`);

export const viewFile = async (fileId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${apiUrl}/api/folder_file/files/view/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const uploadFileViaUrl = (pdfUrl, parentFolderId, projectId) =>
  request('POST', '/api/folder_file/files/upload_file_via_url', {
    pdf_url: pdfUrl,
    parent_folder_id: parentFolderId,
    project_id: projectId,
  });

// Returns a promise that resolves to { response, data } with XHR upload progress support.
// onProgress(percent: number) is called with values 0-50 during upload.
export const uploadFile = (formData, onProgress) => {
  const token = localStorage.getItem('access_token');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 50));
      }
    });

    xhr.open('POST', `${apiUrl}/api/folder_file/files`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ response: xhr, data });
        } catch {
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
};
