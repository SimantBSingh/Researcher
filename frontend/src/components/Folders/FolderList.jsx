import React, { useCallback, useEffect, useState } from "react";
import {
  IconButton,
  TextField,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItem,
  ListItemText,
  Avatar,
  Stack,
  CircularProgress,
  Box,
  Paper,
  Typography,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import BreadCrumb from "../../utils/Breadcrumb";
import CustomMenu from "../../utils/CustomMenu";
import FileFolderModal from "../../utils/FileFolderModal";
import UploadFileModal from "../../utils/UploadFileModal";
import { useParams } from "react-router";

import { ActionTypes, AccessLevel } from "../../constants/enums";
import { useApiHandler } from "../../helpers/useApiHandler";
import {
  getProjectRootContents,
  getFolderContents as apiFolderContents,
  getFiles as apiGetFiles,
  createFolder as apiCreateFolder,
  deleteDocument as apiDeleteDocument,
  editDocument as apiEditDocument,
  viewFile as apiViewFile,
  uploadFile as apiUploadFile,
  uploadFileViaUrl,
} from "../../api/folderFiles";
import { getProjectAsFolder } from "../../api/projects";

const uploadOptions = ["New Folder", "Upload File"];
const folderEditOptions = ["Edit", "Delete"];
const fileEditOptions = ["Edit", "Delete", "Download"];


const createFolderContentsCache = () => {
  const cache = new Map();
  
  return {
    get: (folderId) => cache.get(folderId),
    set: (folderId, data) => cache.set(folderId, data),
    has: (folderId) => cache.has(folderId),
    invalidate: (folderId) => {
      if (folderId) {
        cache.delete(folderId);
      }
    },
    clear: () => cache.clear()
  };
};

// Initialize the cache
const folderCache = createFolderContentsCache();

// Memoized Folder Item Component
const MemoizedFolderItem = React.memo(
  ({ folder, onNavigate, onContextMenu }) => (
    <ListItem secondaryAction={onContextMenu} disablePadding>
      <ListItemButton onClick={() => onNavigate(folder.id, null, folder.name)}>
        <ListItemAvatar>
          <Avatar>
            <FolderIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={folder.name}
          primaryTypographyProps={{
            noWrap: true,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        />
      </ListItemButton>
    </ListItem>
  )
);

// Memoized File Item Component
const MemoizedFileItem = React.memo(({ file, onView, onContextMenu }) => (
  <ListItem secondaryAction={onContextMenu} disablePadding>
    <ListItemButton onClick={() => onView(file.id, file.mime_type)}>
      <ListItemAvatar>
        <Avatar>
          <FileCopyIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={file.name}
        primaryTypographyProps={{
          noWrap: true,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      />
    </ListItemButton>
  </ListItem>
));

export default function FolderList({ refreshKey }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [linkUrl, setLinkUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [path, setPath] = useState([]);
  const [actionType, setActionType] = useState(null);

  const [openFileFolderModal, setOpenFileFolderModal] = useState(false);
  const [openFileUploadModal, setOpenFileUploadModal] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSnackbarOpen, setUploadSnackbarOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ severity: "info", message: "" });

  const { projectId } = useParams();

  const { handleApiResponse } = useApiHandler();


  const loadData = async () => {
    try {
      const cacheKey = currentFolderId || `root_${projectId}`;
      folderCache.invalidate(cacheKey);
      await getFolderContents(currentFolderId);
    } catch (e) {
      alert("Error loading data: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeRootFolder = async () => {
      try {
        const projectFolder = await fetchProjectAsFolder();
        // console.log(projectFolder)
        if (projectFolder) {
          setPath([{ id: null, name: projectFolder.name }]);
          // null = project root level
          await navigateToFolder(null);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setError(error instanceof Error ? error.message : "Initialization failed");
      } finally {
        setIsLoading(false);
      }
    };

    initializeRootFolder();

    // Clear cache when component unmounts
    return () => {
      folderCache.clear();
    };
  }, []);

  useEffect(() => {
    if (refreshKey > 0) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);


  const getFolderContents = useCallback(async (folderId) => {
    // folderId === null means project root level
    const cacheKey = folderId || `root_${projectId}`;

    if (folderCache.has(cacheKey)) {
      const cachedData = folderCache.get(cacheKey);
      setFolders(cachedData.folders || []);
      setFiles(cachedData.files || []);
      return cachedData;
    }

    setIsLoading(true);
    try {
      const { response, data } = folderId
        ? await apiFolderContents(folderId)
        : await getProjectRootContents(projectId);

      if (!response.ok) {
        throw new Error(`Failed to fetch folder contents: ${response.statusText}`);
      }

      setFolders(data.folders || []);
      setFiles(data.files || []);
      folderCache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error("Error fetching folder contents:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);



  const fetchProjectAsFolder = async () => {
    try {
      const { response, data } = await getProjectAsFolder(projectId);
      if (!response.ok) {
        alert(`Failed to fetch project: ${response.statusText}`);
      }
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      console.error("Error fetching project as folder:", error);
    }
  };


  const createFolder = async (folderName) => {
    setIsLoading(true);
    // console.log(currentFolderId, projectId, folderName);
    try {
      const { response, data } = await apiCreateFolder(projectId, currentFolderId, folderName);
      folderCache.invalidate(currentFolderId);
      handleApiResponse(response, data, "Folder created successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const handleDelete = async (documentType, documentId) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteDocument(documentType, projectId, documentId);
      folderCache.invalidate(currentFolderId);
      handleApiResponse(response, data, "Document Deleted successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const handleFileFolderModal = (
    action,
    document = null,
    documentType = null
  ) => {
    if (action === ActionTypes.NEW_FOLDER) {
      setActionType(ActionTypes.CREATE);
      setOpenFileFolderModal(true);
    } else if (action === ActionTypes.EDIT) {
      setSelectedDocument({ document: document, type: documentType });
      setActionType(ActionTypes.EDIT);
      setOpenFileFolderModal(true);
    } else if (action === ActionTypes.UPLOAD_FOLDER) {
      setActionType(ActionTypes.CREATE);
      handleCreate(ActionTypes.UPLOAD_FOLDER);
    } else if (action === ActionTypes.UPLOAD_FILE) {
      setActionType(ActionTypes.CREATE);
      setOpenFileUploadModal(true);
    }
  };


  const navigateToFolder = useCallback(
    async (targetFolderId, pathIndex = null, folderName = null) => {
      await getFolderContents(targetFolderId);

      setPath((prevPath) => {
        if (pathIndex !== null) {
          return prevPath.slice(0, pathIndex + 1);
        }

        // null means going to project root — don't add to path
        if (targetFolderId === null) {
          return prevPath;
        }

        // Prevent duplicates
        if (prevPath.some((f) => f.id === targetFolderId)) {
          return prevPath;
        }

        if (folderName) {
          return [...prevPath, { id: targetFolderId, name: folderName }];
        }

        return prevPath;
      });

      setCurrentFolderId(targetFolderId);
    },
    [getFolderContents]
  );

  const handleSave = (name) => {
    if (actionType === ActionTypes.CREATE) {
      createFolder(name);
    } else if (actionType === ActionTypes.EDIT) {
      editDocument(name);
    }
  };

  const editDocument = async (name) => {
    setIsLoading(true);
    const { document, type } = selectedDocument;
    const documentId = document.id;

    try {
      const { response, data } = await apiEditDocument(type, documentId, name, projectId);
      folderCache.invalidate(currentFolderId);
      handleApiResponse(response, data, "Document Edited successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const fetchFiles = async () => {
    if (!currentFolderId) return [];

    try {
      const { response, data } = await apiGetFiles(currentFolderId);
      if (!response.ok) throw new Error(`Failed to fetch files: ${response.statusText}`);
      return data;
    } catch (error) {
      console.error("Error fetching files:", error);
      return [];
    }
  };

  // Updated handleSaveFile with upload progress accounting for server-side processing
  const handleSaveFile = async (data) => {
    if (!(data[0] instanceof File)) {
      setUploadStatus({
        severity: "error",
        message: "The data passed is not a valid File object"
      });
      setUploadSnackbarOpen(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus({
      severity: "info",
      message: `Uploading ${data[0].name}...`
    });
    setUploadSnackbarOpen(true);

    const formData = new FormData();
    formData.append("file", data[0]);
    formData.append("parent_folder_id", currentFolderId);
    formData.append("project_id", projectId);

    try {
      const { response, data: responseData } = await apiUploadFile(formData, (percent) => {
        setUploadProgress(percent);
      });

      setUploadProgress(100);
      setUploadStatus({
        severity: "success",
        message: "File uploaded successfully",
      });

      folderCache.invalidate(currentFolderId);
      handleApiResponse(response, responseData, "File Uploaded successfully");
    } catch (error) {
      setUploadStatus({
        severity: "error",
        message: `Upload failed: ${error.message}`
      });
      console.error("Upload error:", error);
    } finally {
      setTimeout(() => {
        loadData();
      }, 2000); // Extended time to show completion
      setIsUploading(false);
    }
  };

  const viewFile = async (fileId, mimeType, fileName) => {
    setIsLoading(true);
    try {
      const response = await apiViewFile(fileId);

      if (!response.ok) {
        throw new Error(`Failed to view file: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Received empty file content");
      }

      // Create blob URL
      const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));

      // Open in new window
      window.open(url, "_blank");

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("View error:", err);
      setError(`View failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async () => {
    setIsLoading(true);
    try {
      const { response, data } = await uploadFileViaUrl(linkUrl, currentFolderId, projectId);
      folderCache.invalidate(currentFolderId);
      handleApiResponse(response, data, "File Downloaded successfully");
    } catch (error) {
      alert(error);
    } finally {
      setLinkUrl("");
      await loadData();
    }
  };

  const downloadFileLocally = async (fileId, fileName) => {
    try {
      const response = await apiViewFile(fileId);

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
  
      // Get the blob from the response
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error("Received empty file content");
      }
  
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'Untitled');
      
      // Append to body, click, and clean up
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error("Download error:", error);
      return false;
    }
  }
  
  // Handle closing the snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setUploadSnackbarOpen(false);
  };

  return (
    <Box
      sx={(theme) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: theme.spacing(2),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1),
        },
      })}
    >
      <Typography
        variant="h5"
        component="h2"
        sx={(theme) => ({
          mb: theme.spacing(3),
          [theme.breakpoints.down("sm")]: {
            mb: theme.spacing(2),
            fontSize: "1.5rem",
          },
        })}
      >
        Documents
      </Typography>

      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          p: theme.spacing(2),
          [theme.breakpoints.down("sm")]: {
            p: theme.spacing(1),
          },
        })}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box sx={{ display: "flex", gap: 1 }}>
                  <CustomMenu
                    iconType="AddIcon"
                    options={uploadOptions}
                    handleCreate={handleFileFolderModal}
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Paste Link"
                  variant="outlined"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  disabled={isLoading || isUploading}
                />
                <IconButton
                  aria-label="download"
                  disabled={isLoading || isUploading}
                  onClick={downloadFile}
                  sx={{ alignSelf: { xs: "center", sm: "auto" } }}
                >
                  <DownloadIcon color="primary" />
                </IconButton>
              </Stack>

              {/* Progress bar for uploads */}
              {isUploading && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">{`${Math.round(uploadProgress)}%`}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Box sx={{ width: "100%", overflow: "auto" }}>
                <BreadCrumb path={path} navigateToFolder={navigateToFolder} />
              </Box>
            </Stack>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                bgcolor: "background.paper",
                borderRadius: 1,
              }}
            >
              <List
                sx={{
                  p: 0,
                  "& .MuiListItem-root": {
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  },
                }}
              >
                <List>
                  {folders && folders.length> 0 && folders.map((folder) => (
                    <MemoizedFolderItem
                      key={folder.id}
                      folder={folder}
                      onNavigate={navigateToFolder}
                      onContextMenu={
                        <CustomMenu
                          iconType="MoreVertIcon"
                          options={folderEditOptions}
                          document={folder}
                          documentType="folder"
                          handleDelete={() =>
                            handleDelete("folder", folder.id)
                          }
                          handleEdit={handleFileFolderModal}
                        />
                      }
                    />
                  ))}

                  {files && files.length > 0 && files.map((file) => (
                    <MemoizedFileItem
                      key={file.id}
                      file={file}
                      onView={viewFile}
                      onContextMenu={
                        <CustomMenu
                          iconType="MoreVertIcon"
                          options={fileEditOptions}
                          document={file}
                          documentType="file"
                          handleDelete={() =>
                            handleDelete("file", file.id)
                          }
                          handleEdit={handleFileFolderModal}
                          handleFileDownload={() => downloadFileLocally(file.id, file.name)}
                        />
                      }
                    />
                  ))}
                </List>

                {folders &&
                  folders.length === 0 &&
                  files &&
                  files?.length === 0 && (
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 4 }}
                    >
                      No documents yet. Create a folder or upload a file to get
                      started!
                    </Typography>
                  )}
              </List>
            </Box>
          </>
        )}
      </Box>

      {/* Modals */}
      {openFileFolderModal && (
        <FileFolderModal
          closeModal={() => setOpenFileFolderModal(false)}
          actionType={actionType}
          saveData={handleSave}
          currentDocumentName={selectedDocument?.document.name}
        />
      )}

      {openFileUploadModal && (
        <UploadFileModal
          parentID={currentFolderId}
          closeModal={() => setOpenFileUploadModal(false)}
          saveData={handleSaveFile}
        />
      )}

      {/* Upload Status Snackbar */}
      <Snackbar 
        open={uploadSnackbarOpen} 
        autoHideDuration={uploadStatus.severity === "success" ? 6000 : null} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={uploadStatus.severity} 
          sx={{ width: '100%' }}
        >
          {uploadStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}