import React, { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ShareIcon from "@mui/icons-material/Share";
import {
  CardActionArea,
  Modal,
  TextField,
  CardActions,
  Card,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SharedUserTable from "../../utils/SharedUserTable";

const sharedModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90vw",
  maxWidth: 400,
  height: "auto",
  maxHeight: "90vh",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
  overflowY: "auto",
};

const editModalStyle = {
  ...sharedModalStyle,
  maxWidth: 500,
  height: "auto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

export default function ProjectCard({
  project,
  handleShareProject,
  handleRenameProject,
  handleDeleteProject,
  isShared = false,
}) {
  const navigate = useNavigate();
  const [openSharedModal, setOpenSharedModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [projectName, setProjectName] = useState(project.name);
  const [email, setEmail] = useState("");

  const shareProject = () => {
    handleShareProject([project.id, email]);
    setEmail("");
  };

  const renameProject = () => {
    if (project.name !== projectName) {
      handleRenameProject(project.id, projectName);
      setOpenEditModal(false);
    }
  };

  const deleteProject = () => {
    handleDeleteProject(project.id);
  };

  const navigateToProject = () => {
    navigate(`/main/${project.id}`);
  };

  return (
    <Card sx={{ maxWidth: { xs: "100%", sm: "345px" }, mx: "auto" }}>
      <CardActionArea onClick={navigateToProject}>
        <CardMedia
          component="img"
          alt="Project"
          height="140"
          image={require("../../constants/images/conference.jpg")}
        />
        <CardContent>
          <Typography gutterBottom variant="h6">
            {project.name}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        <Button variant="outlined" startIcon={<DeleteIcon />} onClick={deleteProject} size="small">
          Delete
        </Button>
        <Button variant="contained" endIcon={<EditIcon />} onClick={() => setOpenEditModal(true)} size="small">
          Edit
        </Button>
        {!isShared && (
          <Button variant="contained" endIcon={<ShareIcon />} onClick={() => setOpenSharedModal(true)} size="small">
            Share
          </Button>
        )}
      </CardActions>

      {/* Edit Project Modal */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <Box sx={editModalStyle}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Project Name"
              variant="outlined"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
            />
            <Divider />
            <SharedUserTable project_id={project.id} />
            <Divider />
          </Box>
          <Button 
            fullWidth 
            disabled={projectName === project.name} 
            onClick={renameProject} 
            sx={{ mt: 2 }}
          >
            Save Changes
          </Button>
        </Box>
      </Modal>

      {/* Share Project Modal */}
      <Modal open={openSharedModal} onClose={() => setOpenSharedModal(false)}>
        <Box sx={sharedModalStyle}>
          <TextField
            label="Collaborator Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <Button fullWidth onClick={shareProject} sx={{ mt: 2 }}>
            Invite Collaborator
          </Button>
        </Box>
      </Modal>
    </Card>
  );
}
