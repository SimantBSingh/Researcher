import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid2";
import ProjectCard from "../components/ProjectTemplates/ProjectCard";
import { useApiHandler } from "../helpers/useApiHandler";
import {
  CircularProgress,
  Typography,
  Box,
  Container,
  Paper,
  Avatar,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Stack,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ShareIcon from "@mui/icons-material/Share";

import {
  getAdminProjects,
  shareProject as apiShareProject,
  renameProject as apiRenameProject,
  deleteProject as apiDeleteProject,
} from "../api/projects";

export default function AdminDashboard() {
  const [projects, setProjects] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { handleApiResponse } = useApiHandler();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchProjects();
    } catch (e) {
      alert("Error loading data: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    const projectList = await getProjectList();
    setProjects(projectList);
  };

  const getProjectList = async () => {
    try {
      const { response, data } = await getAdminProjects();
      if (!response.ok) {
        alert(`Failed to fetch projects: ${response.statusText}`);
        return [];
      }
      return data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      alert("Error fetching projects: " + error.message);
      return [];
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
      {/* Header Section */}
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          borderRadius: 3,
          textAlign: "center",
          background: "linear-gradient(135deg, #1976D2, #42A5F5)", // Blue gradient
          color: "white",
          maxWidth: { xs: "90%", sm: "80%", md: "800px" },
          mx: "auto",
          boxShadow: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Manage projects, share access, rename, and delete projects.
        </Typography>
      </Paper>

      {/* Loading Indicator */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <Grid
          container
          spacing={4}
          sx={{ mt: 3, px: 2 }}
          justifyContent={{ xs: "center", lg: "flex-start" }}
        >
          <Stack direction="column" spacing={6} width="100%">
            {projects && Object.keys(projects).length > 0 ? (
              Object.entries(projects).map(([user, userProjects]) => (
                <Box
                  key={user}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: 2,
                    background: "#fafafa",
                  }}
                >
                  {/* User Header */}
                  <Box
                    display="flex"
                    alignItems="center"
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      boxShadow: 1,
                      background: "linear-gradient(135deg, #8E24AA, #D81B60)",
                      color: "white",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "white",
                        color: "black",
                        fontWeight: "bold",
                        mr: 2,
                      }}
                    >
                      {user.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {user}
                    </Typography>
                  </Box>

                  {/* Projects Grid */}
                  <Grid container spacing={3}>
                    {userProjects.map((project) => (
                      <Grid
                        item
                        xs={12}
                        sm={8}
                        md={6}
                        lg={4}
                        key={project.id}
                        display="flex"
                        justifyContent={"center"}
                      >
                        <ProjectCard
                          project={project}
                          handleShareProject={shareProject}
                          handleRenameProject={renameProject}
                          handleDeleteProject={deleteProject}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography
                variant="h6"
                color="textSecondary"
                sx={{ textAlign: "center", width: "100%", mt: 3 }}
              >
                No projects found.
              </Typography>
            )}
          </Stack>
        </Grid>
      )}
    </Container>
  );
}
