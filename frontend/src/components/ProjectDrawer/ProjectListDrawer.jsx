import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate, useParams } from "react-router-dom";
import { getProjects, getSharedProjects } from "../../api/projects";

export default function ProjectListDrawer() {
  const [anchorState, setAnchorState] = useState({
    // top: false,
    left: false,
    // bottom: false,
    // right: false,
  });
  const [projects, setProjects] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);

  const navigate = useNavigate();
  const { projectId } = useParams();

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setAnchorState({ ...anchorState, [anchor]: open });
  };

  useEffect(() => {
    fetchProjects();
    getSharedProjectList();
  }, []);

  const navigateToProject = (newProjectId) => {
    // console.log(newProjectId, projectId)
    if (newProjectId !== projectId) {
      navigate(`/main/${newProjectId}`);
    }
  };

  const fetchProjects = async () => {
    try {
      const { response, data } = await getProjects();
      if (!response.ok) {
        alert(`Failed to fetch projects: ${response.statusText}`);
        return;
      }
      setProjects(data);
    } catch (error) {
      alert("Error fetching projects: " + error.message);
    }
  };

  const getSharedProjectList = async () => {
    try {
      const { response, data } = await getSharedProjects();
      if (!response.ok) {
        alert(`Failed to fetch shared projects: ${response.statusText}`);
        return;
      }
      setSharedProjects(data);
    } catch (error) {
      alert("Error fetching shared projects: " + error.message);
    }

    const list = (anchor) => (
      <Box
        sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 250 }}
        role="presentation"
        onKeyDown={toggleDrawer(anchor, false)}
      >
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">Own Projects</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {projects &&
                projects.length > 0 &&
                projects.map((project) => {
                  return (
                    <ListItem key={project.id} disablePadding>
                      <ListItemButton
                        onClick={() => navigateToProject(project.id)}
                      >
                        <ListItemText primary={project.name} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
            </List>
          </AccordionDetails>
        </Accordion>

        <Divider />

        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="h2">Shared Projects</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {sharedProjects &&
                sharedProjects.length > 0 &&
                sharedProjects.map((sharedProject) => {
                  return (
                    <ListItem key={sharedProject.id} disablePadding>
                      <ListItemButton
                        onClick={() => navigateToProject(sharedProject.id)}
                      >
                        <ListItemText primary={sharedProject.name} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    );

    return (
      <div>
        <IconButton
          aria-label="open drawer"
          onClick={toggleDrawer("left", true)}
          edge="start"
          sx={[
            {
              ml: 2,
              color: "white",
            },
            anchorState["left"] && { display: "none" },
          ]}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          anchor={"left"}
          open={anchorState["left"]}
          onClose={toggleDrawer("left", false)}
        >
          {list("left")}
        </Drawer>
      </div>
    );
  };
}
