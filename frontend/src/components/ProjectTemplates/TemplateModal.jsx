import React, { useEffect, useState } from "react";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import IconButton from "@mui/joy/IconButton";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Edit } from "@mui/icons-material";
import { getTemplateByName } from "../../api/templates";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  height: 400,
  display: "flex",
  flexDirection: "column",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflow: "scroll",
};

export default function TemplateModal({
  closeModal,
  saveData,
  selectedTemplate,
}) {
  const [templateName, setTemplateName] = useState(
    selectedTemplate ? selectedTemplate.name : ""
  );
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    // 
    if (selectedTemplate) {
      fetchFolders(selectedTemplate);
    }
  }, []);

  const fetchFolders = async (templateName) => {
    try {
      const { response, data } = await getTemplateByName(templateName);
      if (response.status !== 200) {
        alert(data.error);
      } else {
        setFolders(data.folders);
        setTemplateName(data.name);
      }
    } catch (error) {
      alert(error);
    }
  };

  const handleSaveData = () => {
    if (templateName === "") {
      alert("Template name cannot be empty");
      return;
    }
    if (selectedTemplate !== null && selectedTemplate !== templateName) {
      setIsEdited(true);
    }
    saveData({
      isEdited: isEdited,
      templateName: templateName,
      folders: folders,
    });
    closeModal();
  };

  const addFolders = () => {
    if (selectedTemplate !== null) {
      setIsEdited(true);
    }

    if (folderName === "") {
      alert("Folder name cannot be empty");
      return;
    } else if (folders.includes(folderName)) {
      alert("Folder already exists");
      return;
    }

    setFolders([...folders, folderName]);
    setFolderName("");
  };


  const deleteFolder = (folderToDelete) => {
    const updatedFolders = folders.filter((folder) => {
      // Check if the folder is an object with an id or name property
      if (typeof folder === "object" && folder !== null) {
        // Match by ID if folderToDelete is a number, or by name if it's a string
        return typeof folderToDelete === "number"
          ? folder.id !== folderToDelete
          : folder.name !== folderToDelete;
      } else if (typeof folder === "string") {
        // For string-type folders, check if the name matches folderToDelete
        return folder !== folderToDelete;
      }
      return true; // Keep folder if it doesn't match any deletion criteria
    });
  
    setFolders(updatedFolders);
    if (selectedTemplate !== null) {
      setIsEdited(true);
    }
  };
  

  const editFolder = (folderToEdit) => {
    const editedFolders = folders && folders.length > 0 && folders.map((folder) => {
      if (typeof folder === "object" && folder !== null) {
        // Handle object-type folders
        const isMatchingFolder =
          typeof folderToEdit === "number"
            ? folder.id === folderToEdit
            : folder.name === folderToEdit;
  
        if (isMatchingFolder) {
          // Check if the new name is the same as the current name
          if (folder.name === folderName) {
            setIsEdited(false);
          } else if (selectedTemplate !== null) {
            setIsEdited(true);
          }
          return { ...folder, name: folderName }; // Update the name in object
        }
      } else if (typeof folder === "string") {
        // Handle string-type folders
        if (folder === folderToEdit) {
          if (folder === folderName) {
            setIsEdited(false);
          } else if (selectedTemplate !== null) {
            setIsEdited(true);
          }
          return folderName; // Update the string directly
        }
      }
      return folder; // Return unchanged folder
    });
  
    setFolders(editedFolders);
  };
  

  const handleTemplateNameChange = (e) => {
    setTemplateName(e.target.value);
    if (selectedTemplate !== null && selectedTemplate !== e.target.value) {
      setIsEdited(true);
    }
  };

  return (
    <div style={{ overflow: "scroll" }}>
      <Modal
        open={true}
        onClose={closeModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <TextField
            id="outlined-basic"
            // label="Template Name"
            variant="outlined"
            value={templateName}
            onChange={handleTemplateNameChange}
          />
          <List sx={{ maxWidth: 300, flex: 1 }}>
            <ListItem
              startAction={
                <IconButton
                  aria-label="Add"
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={addFolders}
                >
                  <Add />
                </IconButton>
              }
            >
              <TextField
                id="outlined-basic"
                label={"Folder Name"}
                variant="standard"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                sx={{ marginLeft: 5 }}
              />
            </ListItem>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {folders &&
                folders.length > 0 &&
                folders.map((folder, index) => (
                  <ListItem //onClick={deleteFolder(folder)}
                    key={index}
                    endAction={
                      <>
                        <IconButton
                          aria-label="Delete"
                          size="sm"
                          color="danger"
                          onClick={() =>
                            editFolder(folder.id ? folder.id : folder)
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          aria-label="Delete"
                          size="sm"
                          color="danger"
                          onClick={() =>
                            deleteFolder(folder.id ? folder.id : folder)
                          }
                        >
                          <Delete />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItem key={index}>
                      <Typography>
                        {folder.name ? folder.name : folder}
                      </Typography>
                    </ListItem>
                  </ListItem>
                ))}
            </div>
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2 }}>
            <Button onClick={closeModal} sx={{ mr: 1 }}>Cancel</Button>
            <Button onClick={handleSaveData}>OK</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}