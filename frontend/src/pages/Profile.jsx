import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Grid2, Paper } from "@mui/material";
import { useAuth } from "../AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../api/auth";
import { useSnackbar } from "../utils/SnackbarContext";

const Profile = () => {
  const { user, handleLogout, checkToken } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    institution: "",
    email: "",
    zoom: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        position: user.position || "",
        institution: user.institution || "",
        email: user.email || "",
        zoom: user.zoom || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      const { response, data: updatedUser } = await updateProfile(formData);

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      showSnackbar("Profile updated successfully!");

      // Save new user info in localStorage so it updates globally
      localStorage.setItem("user_info", JSON.stringify(updatedUser));

      // Re-check the token and update context
      checkToken();

      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile.");
    }
  };

  const logout = () => {
    handleLogout();
    navigate("/signin");
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Typography variant="h4" sx={{ mb: 3, textAlign: "center" }}>
          My Profile
        </Typography>

        <Grid2 container spacing={2}>
          {Object.keys(formData).map((field) => (
            <Grid2 item xs={12} sm={6} key={field}>
              <TextField
                label={field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  readOnly: !editing,
                }}
              />
            </Grid2>
          ))}
        </Grid2>

        <Box sx={styles.buttonContainer}>
          {!editing ? (
            <Button variant="contained" onClick={() => setEditing(true)} sx={{ mt: 3 }}>
              Edit Profile
            </Button>
          ) : (
            <Button variant="contained" color="success" onClick={handleSave} sx={{ mt: 3 }}>
              Save Changes
            </Button>
          )}
          <Button variant="outlined" color="error" onClick={logout} sx={{ mt: 3, ml: 2 }}>
            Log Out
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

const styles = {
  container: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    p: 2,
  },
  paper: {
    width: "100%",
    maxWidth: "700px",
    p: 4,
    borderRadius: 4,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
  },
};

export default Profile;
