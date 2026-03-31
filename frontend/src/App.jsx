import "./App.css";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Main from "./pages/Main";
import ProjectList from "./pages/ProjectList";
import AdminDashboard from "./pages/AdminDashboard";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./AuthContext/AuthContext";
import { SnackbarProvider } from "./utils/SnackbarContext";
import ProtectedRoute from "./AuthContext/ProtectedRoute";
import { useAuth } from "./AuthContext/AuthContext";
import ProjectListDrawer from "./components/ProjectDrawer/ProjectListDrawer";
import { Box, Typography, Button, IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { useEffect, useState } from "react";
import { getProjectAsFolder } from "./api/projects";
import Profile from "./pages/Profile";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

// Separate layout component for the header
const Header = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');

  const isMainPage = location.pathname.startsWith("/main/");

  const navigateToProjects = () => {
    navigate("/projects");
  };

  const navigateToProfile = () => {
    navigate("/profile");
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (isMainPage) {
        const projectId = location.pathname.split("/")[2];
        const project = await getProject(projectId);

        if (project && project.name) {
          setProjectName(project.name);
        } else {
          setProjectName("");
        }
      } else {
        setProjectName("");
      }
    };

    fetchProject();
  }, [location.pathname, isMainPage]);

  const getProject = async (projectId) => {
    try {
      const { response, data } = await getProjectAsFolder(projectId);
      if (!response.ok) {
        alert(`Failed to fetch project: ${response.statusText}`);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error fetching project:", error.message);
      return null;
    }
  };

  return (
    <Box sx={styles.header}>
      {isAuthenticated && isMainPage && (
        <Box sx={styles.drawerContainer}>
          <ProjectListDrawer />
        </Box>
      )}
      <Typography variant="h4" component="h1" sx={styles.headerTitle}>
        {projectName ? projectName : "Researcher"}
      </Typography>

      {isAuthenticated && (
        <Box sx={styles.iconGroupContainer}>
            <Button sx={styles.iconButton} onClick={navigateToProjects}>
              <HomeIcon color={"inherit"} fontSize="large" />
            </Button>
            <Button
              onClick={navigateToProfile}
              sx={styles.profileButton}
            >
              <ManageAccountsIcon color="inherit" fontSize="large"/>
            </Button>
        </Box>
      )}
    </Box>
  );
};


function App() {
  return (
    <AuthProvider>
      <SnackbarProvider>
      <Router>
        <Box sx={styles.root}>
          <Header />
          <Box sx={styles.content}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/signin" />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
                <Route
                  path="/projects"
                  element={
                    <ProjectList />
                  }
                />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route
                  path="/admin/projects"
                  element={
                    <AdminDashboard />
                  }
                />
              </Route>

              <Route
                element={<ProtectedRoute allowedRoles={["USER", "ADMIN"]} />}
              >
                <Route
                  path="/main/:projectId"
                  element={
                    <Main />
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Profile />
                  }
                />
              </Route>
            </Routes>
          </Box>
        </Box>
      </Router>
      </SnackbarProvider>
    </AuthProvider>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
  },
  header: (theme) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#22272B",
    position: "relative",
    px: { xs: 2, sm: 3 },
    py: { xs: 1.5, sm: 2 },
    height: { xs: "56px", sm: "64px" },
    boxSizing: "border-box",
  }),
  drawerContainer: {
    position: "absolute",
    left: 0,
    height: "100%",
    display: "flex",
    alignItems: "center",
    px: { xs: 1, sm: 2 },
  },
  homeIconContainer: {
    position: "absolute",
    right: 0,
    height: "100%",
    display: "flex",
    alignItems: "center",
    color: "white",
    px: { xs: 1, sm: 2 },
  },
  headerTitle: (theme) => ({
    width: "100%",
    textAlign: "center",
    color: "#DEE4EA",
    fontSize: {
      xs: "1.5rem",
      sm: "2rem",
    },
    fontWeight: 500,
  }),
  content: {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  iconGroupContainer: {
    position: "absolute",
    right: 0,
    display: "flex",
    alignItems: "center",
    height: "100%",
    px: { xs: 1, sm: 2 },
  },
  iconButton: {
    color: "white",
    mx: 1,
  },
  profileButton: {
    color: "white",
    mx: 1,
    fontWeight: 500,
    textTransform: "none",
  },

};

export default App;
