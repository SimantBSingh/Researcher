export const ActionTypes = Object.freeze({
    NEW_FOLDER: 'new folder',
    NEW_FILE: 'new file',
    UPLOAD_FOLDER: 'upload folder',
    UPLOAD_FILE: 'upload file',

    // Type (in CustomMenu) is declared to determine whether the action is committed to a file or a folder.
    DELETE: 'delete',
    EDIT: 'edit',
    DOWNLOAD: 'download',
    
    VIEW: 'view',

    CREATE: 'create',
  });

  export const DocumentType = Object.freeze({
    FOLDER: 'folder',
    FILE: 'file',
  })

  export const AccessLevel = Object.freeze({
    READ: 'read',
    WRITE: 'write',
    ADMIN: 'admin',
  })
  
  // export default ActionTypes;
  