import React, { useState, useEffect } from "react";
import Tasks from "../components/Tasks/Tasks";
import Collaborators from "../components/Collaborators/Collaborators";
import FolderList from "../components/Folders/FolderList";
import DeadlineList from "../components/Deadlines/DeadlineList";
import Notes from "../components/Notes/Notes";
import Links from "../components/Links/Links";
import {
  Box,
  Tab,
  Tabs,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAccessLevel } from "../api/projects";
import { getTasks } from "../api/tasks";
import { getNotes } from "../api/notes";
import { getLinks } from "../api/links";
import { useProjectEvents } from "../hooks/useProjectEvents";
import { useUserEvents } from "../hooks/useUserEvents";

function CustomTabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{ height: '100%' }}
      {...other}
    >
      {value === index && children}
    </Box>
  );
}

export default function Main() {
  const [value, setValue] = useState(0);
  const [accessLevel, setAccessLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state for all data needed by child components
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [links, setLinks] = useState([]);

  // refreshKey counters for components that manage their own data
  const [deadlineRefreshKey, setDeadlineRefreshKey] = useState(0);
  const [collaboratorsRefreshKey, setCollaboratorsRefreshKey] = useState(0);
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useProjectEvents(projectId, {
    tasks_changed: () => fetchTasks(),
    notes_changed: () => fetchNotes(),
    links_changed: () => fetchLinks(),
    deadlines_changed: () => setDeadlineRefreshKey((k) => k + 1),
    collaborators_changed: () => setCollaboratorsRefreshKey((k) => k + 1),
    files_changed: () => setFilesRefreshKey((k) => k + 1),
  });

  useUserEvents({
    projects_changed: () => fetchAccessLevel(),
    access_revoked: ({ project_id }) => {
      if (String(project_id) === String(projectId)) {
        navigate("/projects", { state: { snackbar: { message: "You have been removed from this project.", severity: "warning" } } });
      }
    },
    project_deleted: ({ project_id }) => {
      if (String(project_id) === String(projectId)) {
        navigate("/projects", { state: { snackbar: { message: "This project has been deleted.", severity: "warning" } } });
      }
    },
  });
  const theme = useTheme();
  
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setValue(0);
    setAccessLevel(null);
    setIsLoading(true);
    
    const fetchAllData = async () => {
      try {
        await fetchAccessLevel();
        await fetchTasks();
        await fetchNotes();
        await fetchLinks();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, [projectId, location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const fetchAccessLevel = async () => {
    try {
      const { response, data } = await getAccessLevel(projectId);

      if (response.status === 403) {
        alert("Access denied. You don't have the necessary permissions to view this project.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch access level: ${response.statusText}`);
      }

      setAccessLevel(data);
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const { response, data } = await getTasks(projectId);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error.message);
    }
  };

  const fetchNotes = async () => {
    try {
      const { response, data } = await getNotes(projectId);
      if (!response.ok) {
        console.error("Failed to get notes");
      } else {
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const fetchLinks = async () => {
    try {
      const { response, data } = await getLinks(projectId);
      if (!response.ok) {
        console.error("Failed to fetch links");
      } else {
        setLinks(data);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    }
  };

  // Create update functions for passing to child components
  const updateTasks = async (newTasks) => {
    setTasks(newTasks);
  };

  const updateNotes = async (newNotes) => {
    setNotes(newNotes);
  };

  const updateLinks = async (newLinks) => {
    setLinks(newLinks);
  };

  if (accessLevel === null || isLoading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  const renderTasksSection = () => (
    <Paper elevation={2} sx={styles.paper}>
      <Tabs value={value} onChange={handleChange} sx={styles.tabs}>
        <Tab label="Tasks" />
        <Tab label="Quick Notes" />
        <Tab label="Links" />
      </Tabs>
      <Box sx={styles.tabContent}>
        <CustomTabPanel value={value} index={0}>
          <Tasks 
            accessLevel={accessLevel} 
            tasks={tasks}
            updateTasks={updateTasks}
            projectId={projectId}
          />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <Notes 
            accessLevel={accessLevel}
            notes={notes}
            updateNotes={updateNotes}
            projectId={projectId}
          />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <Links 
            accessLevel={accessLevel}
            links={links}
            updateLinks={updateLinks}
            projectId={projectId}
          />
        </CustomTabPanel>
      </Box>
    </Paper>
  );

  return (
    <Box sx={styles.root}>
      <Box sx={styles.mainContainer}>
        {isDesktop && (
          // Desktop Layout - Three columns
          <Box sx={styles.desktopLayout}>
            <Box sx={styles.leftSection}>
              {renderTasksSection()}
            </Box>
            <Box sx={styles.middleSection}>
              <Paper elevation={2} sx={styles.paper}>
                <FolderList accessLevel={accessLevel} refreshKey={filesRefreshKey} />
              </Paper>
            </Box>
            <Box sx={styles.rightSection}>
              <Paper elevation={2} sx={styles.paper}>
                <DeadlineList accessLevel={accessLevel} refreshKey={deadlineRefreshKey} />
              </Paper>
              <Paper elevation={2} sx={styles.paper}>
                <Collaborators accessLevel={accessLevel} refreshKey={collaboratorsRefreshKey} />
              </Paper>
            </Box>
          </Box>
        )}

        {isTablet && (
          // Tablet Layout - Two rows, each split into two columns
          <Box sx={styles.tabletLayout}>
            {/* Top Row */}
            <Box sx={styles.tabletRow}>
              <Box sx={styles.tabletColumn}>
                {renderTasksSection()}
              </Box>
              <Box sx={styles.tabletColumn}>
                <Paper elevation={2} sx={styles.paper}>
                  <FolderList accessLevel={accessLevel} refreshKey={filesRefreshKey} />
                </Paper>
              </Box>
            </Box>
            {/* Bottom Row */}
            <Box sx={styles.tabletRow}>
              <Box sx={styles.tabletColumn}>
                <Paper elevation={2} sx={styles.paper}>
                  <DeadlineList accessLevel={accessLevel} refreshKey={deadlineRefreshKey} />
                </Paper>
              </Box>
              <Box sx={styles.tabletColumn}>
                <Paper elevation={2} sx={styles.paper}>
                  <Collaborators accessLevel={accessLevel} refreshKey={collaboratorsRefreshKey} />
                </Paper>
              </Box>
            </Box>
          </Box>
        )}

        {isMobile && (
          // Mobile Layout - Single column
          <Box sx={styles.mobileLayout}>
            {renderTasksSection()}
            <Paper elevation={2} sx={styles.paper}>
              <FolderList accessLevel={accessLevel} refreshKey={filesRefreshKey} />
            </Paper>
            <Paper elevation={2} sx={styles.paper}>
              <DeadlineList accessLevel={accessLevel} refreshKey={deadlineRefreshKey} />
            </Paper>
            <Paper elevation={2} sx={styles.paper}>
              <Collaborators accessLevel={accessLevel} refreshKey={collaboratorsRefreshKey} />
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const styles = {
  root: {
    height: '93vh',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    width: '100%',
    height: 'calc(100% - 20px)',
    padding: '10px',
    boxSizing: 'border-box',
  },
  paper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tabs: {
    borderBottom: 1,
    borderColor: 'divider',
    minHeight: 48,
  },
  tabContent: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  
  // Desktop-specific styles
  desktopLayout: {
    display: 'flex',
    gap: '10px',
    height: '100%',
  },
  leftSection: {
    width: '30%',
    height: '100%',
  },
  middleSection: {
    width: '35%',
    height: '100%',
  },
  rightSection: {
    width: '35%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    '& > .MuiPaper-root': {
      height: '50%',
    },
  },

  // Tablet-specific styles
  tabletLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    height: '100%',
  },
  tabletRow: {
    display: 'flex',
    gap: '10px',
    height: '50%',
  },
  tabletColumn: {
    width: '49%',
    height: '100%',
  },

  // Mobile-specific styles
  mobileLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    height: '100%',
    overflowY: 'auto',
    '& > .MuiPaper-root': {
      minHeight: '400px',
    },
  },
};