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
import { getTemplateFolders } from "../api/templates";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  height: 400,

  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflow: 'scroll'
};

// onClick={closeModal}

export default function TemplateModal({
  type,
  closeModal,
  saveData,
  currentFolder,
}) {
  const [templateName, setTemplateName] = useState(currentFolder ? currentFolder.name : "");
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    // 
    if (currentFolder) {
      fetchFolders(currentFolder);
    }
  }, []);

  const fetchFolders = async (parentFolder) => {
    try {
      const { response, data } = await getTemplateFolders(parentFolder.id);
      if (response.status !== 200) {
        alert(data.error);
      } else {
        setFolders(data.template_folders);
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
    saveData([templateName, folders]);
    closeModal();
  };

  const addFolders = () => {
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

  const deleteFolder = (folder) => {
    setFolders(folders.filter((f) => f !== folder));
  };

  return (
    <div style={{overflow: 'scroll'}}>
      <Modal
        open={true}
        onClose={closeModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <TextField
            id="outlined-basic"
            label={"Template Name"}
            variant="outlined"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSaveData}>OK</Button>
          <List sx={{ maxWidth: 300 }}>
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
              {folders && folders.length > 0 && folders.map((folder, index) => (
                <ListItem //onClick={deleteFolder(folder)}
                  endAction={
                    <IconButton
                      aria-label="Delete"
                      size="sm"
                      color="danger"
                      onClick={() => deleteFolder(folder)}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItem key={index}>
                    <Typography>{folder}</Typography>
                  </ListItem>
                </ListItem>
              ))}
            </div>
          </List>
        </Box>
      </Modal>
    </div>
  );
}
