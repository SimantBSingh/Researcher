import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DragHandle, Clear, ExpandMore, Edit } from "@mui/icons-material";
import { useApiHandler } from "../../helpers/useApiHandler";
import {
  getLinks,
  createLink,
  updateLink as apiUpdateLink,
  deleteLink as apiDeleteLink,
  reorderLinks,
} from "../../api/links";

export default function Links({ accessLevel, links, updateLinks, projectId }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [newLink, setNewLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState({
    id: null,
    title: "",
    url: "",
  });

  const { handleApiResponse } = useApiHandler();

  const addLink = async () => {
    if (!newLink) return;

    setIsLoading(true);
    try {
      const { response, data } = await createLink(newLink, projectId);
      setNewLink("");
      handleApiResponse(response, data, "New Link added successfully");

      if (response.ok) {
        const { response: fetchResponse, data: fetchedLinks } = await getLinks(projectId);
        if (fetchResponse.ok) {
          updateLinks(fetchedLinks);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLink = async (event, id) => {
    event.stopPropagation();
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteLink(id, projectId);
      handleApiResponse(response, data, "Link deleted successfully");

      if (response.ok) {
        updateLinks(links.filter(link => link.id !== id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLink = async () => {
    if (!editingLink.url) return;

    setIsLoading(true);
    try {
      const { response, data } = await apiUpdateLink(
        editingLink.id,
        projectId,
        editingLink.url,
        editingLink.title
      );
      handleApiResponse(response, data, "Link updated successfully");

      if (response.ok) {
        const updatedLinks = links.map(link =>
          link.id === editingLink.id ? { ...link, url: editingLink.url, title: editingLink.title } : link
        );
        updateLinks(updatedLinks);
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openLink = (link) => {
    let url = link.url.startsWith("http") ? link.url : `https://${link.url}`;
    window.open(url, "_blank");
  };

  const openEditDialog = (event, link) => {
    event.stopPropagation();
    setEditingLink({
      id: link.id,
      url: link.url,
      title: link.title || "",
    });
    setEditDialogOpen(true);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };
  
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dragIndex === dropIndex) return;
  
    const updatedLinks = [...links];
    const [draggedItem] = updatedLinks.splice(dragIndex, 1);
    updatedLinks.splice(dropIndex, 0, draggedItem);
    updateLinks(updatedLinks);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary for onDrop to work
  };

  const handleDragEnd = async () => {
    if (draggedItem !== null) {
      try {
        const { response, data } = await reorderLinks(projectId, links.map(link => link.id));
        handleApiResponse(response, data, "Links reordered successfully", false);
      } catch (error) {
        console.error(error);
      }
    }
    setDraggedItem(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addLink();
    }
  };

  return (
    <div style={localStyles.linkListContainer}>
      <h1>Links</h1>
      <div style={localStyles.links}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "60%",
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <div style={localStyles.linkListContent}>
            <Paper elevation={2} sx={{ mb: 3, overflow: "auto", width: "85%" }}>
              <List sx={{ p: 0, overflow: "auto" }}>
                {links.map((item, index) => (
                  <ListItem
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    sx={{
                      borderBottom:
                        index < links.length - 1 ? "1px solid #eee" : "none",
                      p: 0,
                    }}
                  >
                    <Accordion sx={{ width: "100%" }}>
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        aria-controls={`panel${index}-content`}
                        id={`panel${index}-header`}
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <DragHandle sx={{ color: "text.secondary", mr: 1 }} />
                        <Typography sx={{ flex: 1, fontWeight: "medium" }}>
                          {item.title || item.url}
                        </Typography>
                        <IconButton
                          edge="end"
                          onClick={(e) => openEditDialog(e, item)}
                          size="small"
                          sx={{ color: "text.secondary", ml: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={(e) => deleteLink(e, item.id)}
                          size="small"
                          sx={{ color: "text.secondary", ml: 1 }}
                        >
                          <Clear />
                        </IconButton>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          sx={{
                            wordBreak: "break-all",
                            cursor: "pointer",
                            color: "primary.main",
                            textDecoration: "underline",
                            "&:hover": { opacity: 0.8 },
                          }}
                          onClick={() => openLink(item)}
                        >
                          {item.url}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Box sx={{ display: "flex", width: "85%", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new link"
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={addLink}
                sx={{ minWidth: "100px" }}
              >
                Add
              </Button>
            </Box>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={editingLink.title}
            onChange={(e) =>
              setEditingLink({ ...editingLink, title: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="URL"
            fullWidth
            variant="outlined"
            value={editingLink.url}
            onChange={(e) =>
              setEditingLink({ ...editingLink, url: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={updateLink} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const localStyles = {
  linkListContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    padding: 0,
  },
  links: {
    width: "100%",
    height: "90%",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    padding: 0,
  },
  linkListContent: {
    overflow: "auto",
    width: "100%",
    height: "90%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
};
