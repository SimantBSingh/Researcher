import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Stack,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Container,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ProjectCard from "../components/ProjectTemplates/ProjectCard";
// import Templates from "../components/ProjectTemplates/Templates";
import TemplateModal from "../components/ProjectTemplates/TemplateModal";
import { Delete, Edit, Share } from "@mui/icons-material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { CustomTabPanel, a11yProps } from "../utils/CustomTabPanel";
import { useApiHandler } from "../helpers/useApiHandler";
import { useUserEvents } from "../hooks/useUserEvents";
import { useSnackbar } from "../utils/SnackbarContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getProjects,
  getSharedProjects,
  createProject as apiCreateProject,
  renameProject as apiRenameProject,
  deleteProject as apiDeleteProject,
  shareProject as apiShareProject,
  syncProjects,
} from "../api/projects";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../api/templates";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [tabValue, setTabValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const [selectOpen, setSelectOpen] = useState(false);

  const { handleApiResponse } = useApiHandler();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const snackbarShown = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.snackbar && !snackbarShown.current) {
      snackbarShown.current = true;
      const { message, severity } = location.state.snackbar;
      showSnackbar(message, severity);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  useUserEvents({
    projects_changed: () => getSharedProjectList(),
    access_revoked: () => getSharedProjectList(),
    project_deleted: () => getSharedProjectList(),
  });

  const loadData = async () => {
    try {
      await fetchProjects();
      await getSharedProjectList();
      await fetchTemplates();
    } catch (e) {
      alert("Error loading data: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOpen = () => {
    setSelectOpen(!selectOpen);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { response, data } = await syncProjects();
      if (!response.ok) {
        alert(`Failed to sync projects: ${response.statusText}`);
      }
      return data;
    } catch (error) {
      console.error("Error syncing projects:", error);
      alert("Error syncing projects: " + error.message);
      return [];
    } finally {
      await loadData();
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
      console.error("Error fetching projects:", error);
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
  };

  const createProject = async () => {
    setIsLoading(true);
    try {
      const { response, data } = await apiCreateProject({
        name: projectName,
        template_name: selectedTemplate,
      });
      handleApiResponse(response, data, "Project created successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const renameProject = async (projectId, newProjectName) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiRenameProject(projectId, newProjectName);
      handleApiResponse(response, data, "Project Renamed successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const deleteProject = async (projectId) => {
    setIsLoading(true);
    try {
      const { response, data } = await apiDeleteProject(projectId);
      handleApiResponse(response, data, "Project Deleted successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const shareProject = async (shareData) => {
    setIsLoading(true);
    const [project_id, email] = shareData;
    try {
      const { response, data } = await apiShareProject(project_id, email);
      handleApiResponse(response, data, "Project Shared to Collaborator successfully");
    } catch (error) {
      alert(error);
    } finally {
      await loadData();
    }
  };

  const fetchTemplates = async () => {
    try {
      const { response, data } = await getTemplates();
      if (!response.ok) {
        alert(`Failed to fetch templates: ${response.statusText}`);
        return;
      }
      setTemplates(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModal = () => {
    setOpenTemplateModal(!openTemplateModal);
  };

  const openCreateTemplateModal = () => {
    setSelectedTemplate(null);
    handleModal();
  };

  const handleSelectTemplateItem = (event) => {
    const templateName = event.target.value;
    setSelectedTemplate(templateName);
  };

  const handleSaveData = async (data) => {
    setIsLoading(true)
    const isEditedTemplate = data.isEdited;

    let templateData;

    if (isEditedTemplate) {
      const transformedFolders =
        data.folders &&
        data.folders.length > 0 &&
        data.folders.map((folder) => ({
          id: folder.id || 0, // Convert undefined to null
          name: folder.id ? folder.name : folder,
          owner_id: folder.owner_id || null,
          created_at: folder.created_at || null,
          template_id: folder.template_id || null,
        }));

      templateData = {
        originalName: selectedTemplate,
        toBeEditedName: data.templateName,
        // folders: data.folders,
        folders: transformedFolders,
      };
    } else {
      templateData = {
        name: data.templateName,
        folders: data.folders,
      };
    }

    const encodedOriginalTemplateName = encodeURIComponent(selectedTemplate);

    try {
      const { response, data } = isEditedTemplate
        ? await updateTemplate(encodedOriginalTemplateName, templateData)
        : await createTemplate(templateData);

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      handleApiResponse(response, data, isEditedTemplate ? "Template Edited" : "Template Created");
    } catch (err) {
      console.error("Error updating template:", err);
      setError(err.message);
    }
    await loadData();
  };

  const handleTemplateDelete = async (templateId) => {
    event.stopPropagation();

    try {
      const { response } = await deleteTemplate(templateId);
      if (!response.ok) {
        throw new Error("Failed to delete template");
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      setError(err.message);
    }
    fetchTemplates();
  };

  return (
    <Container maxWidth="lg">
      {/* Page Title */}
      <Typography variant="h4" sx={{ textAlign: "center", my: 3 }}>
        Project Management
      </Typography>
      {/* Create Project + Template Selection + Create Template Button */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            width: "100%",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {/* Project Name & Create Project */}
          <Stack
            direction="column"
            spacing={2}
            sx={{ width: { xs: "100%", sm: "50%", md: "30%" } }}
          >
            <TextField
              label="Project Name"
              variant="outlined"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={createProject}>
              Create Project
            </Button>
          </Stack>

          {/* Template Selection & Create New Template */}
          <Stack
            direction="column"
            spacing={2}
            sx={{ width: { xs: "100%", sm: "50%", md: "30%" } }}
          >
            <FormControl fullWidth>
              <InputLabel>Select Template</InputLabel>
              <Select
                open={selectOpen}
                onClose={handleSelectOpen}
                onOpen={handleSelectOpen}
                value={selectedTemplate || ""}
                label="Template"
                onChange={handleSelectTemplateItem}
              >
                {templates &&
                  templates.length > 0 &&
                  templates?.map((template) => (
                    <MenuItem
                      key={template.id}
                      value={template.name}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pr: 2, // padding-right for delete icon
                      }}
                    >
                      <ListItemText primary={template.name} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => handleTemplateDelete(template.id, e)}
                          size="small"
                          sx={{ mr: -1 }}
                        >
                          <Delete />
                        </IconButton>
                        <IconButton
                          edge="start"
                          aria-label="edit"
                          onClick={handleModal}
                          size="small"
                          sx={{ mr: -1 }}
                        >
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={openCreateTemplateModal}>
              Create New Template
            </Button>
          </Stack>
        </Stack>

        {/* Template Modal */}
        {openTemplateModal && (
          <TemplateModal
            type="folder"
            closeModal={handleModal}
            saveData={handleSaveData}
            selectedTemplate={selectedTemplate}
          />
        )}
      </Box>
      {/* Tabs for My Projects & Shared Projects */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          minWidth: "100%",
        }}
      >
        <IconButton
          onClick={() => handleRefresh()}
          sx={{ alignSelf: { xs: "center", sm: "auto" } }}
          title="Refresh Projects"
        >
          <RefreshIcon color="primary" />
        </IconButton>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="fullWidth"
          sx={{ width: "100%" }}
        >
          <Tab label="My Projects" {...a11yProps(0)} />
          <Tab label="Shared Projects" {...a11yProps(1)} />
        </Tabs>
      </div>
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
          <CustomTabPanel value={tabValue} index={0}>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {projects &&
                projects.length > 0 &&
                projects.map((project) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <ProjectCard
                      key={project.id}
                      project={project}
                      handleShareProject={shareProject}
                      handleRenameProject={renameProject}
                      handleDeleteProject={deleteProject}
                    />
                  </Grid>
                ))}
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={1}>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {sharedProjects &&
                sharedProjects.length > 0 &&
                sharedProjects.map((sharedProject) => (
                  <Grid item xs={12} sm={6} md={4} key={sharedProject.id}>
                    <ProjectCard
                      key={sharedProject.id}
                      project={sharedProject}
                      handleRenameProject={renameProject}
                      handleDeleteProject={deleteProject}
                      isShared={true}
                    />
                  </Grid>
                ))}
            </Grid>
          </CustomTabPanel>
        </>
      )}
      {/* Template Modals */}
      {/* <TemplateModal open={openTemplateModal} onClose={toggleTemplateModal} /> */}
      {openTemplateModal && (
        <TemplateModal
          type="folder"
          closeModal={handleModal}
          saveData={handleSaveData}
          selectedTemplate={selectedTemplate}
        />
      )}{" "}
    </Container>
  );
}
