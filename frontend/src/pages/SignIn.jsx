import React, { useState } from "react";
import {
  Button,
  TextField,
  Link,
  Box,
  Typography,
  Container,
  Stack,
  Avatar,
  IconButton,
  InputAdornment,
  CssBaseline
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LockOutlined as LockOutlinedIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import LoadingScreen from "../utils/LoadingScreen";

const defaultTheme = createTheme();

export default function SignIn() {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const userData = Object.fromEntries(formData.entries()); // Converts FormData to a JSON object

    try {
      const { response, data } = await login(userData);

      if (!response.ok) {
        alert("Invalid Credentials");
        return;
      }

      handleLogin(data.access_token, data.user);

      if (data.user.position === "admin") {
        navigate("/admin/projects");
      } else {
        navigate("/projects");
      }
    } catch (error) {
      console.error(error.message); // Handle error
      alert("Login failed: " + error.message); // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <LoadingScreen desc={"Logging you in. Please Wait.."} height="80vh" />
  ) : (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        onMouseDown={handleMouseDownPassword}
                        edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Stack>
              <Link href="/signup" variant="body2" textAlign={"center"}>
                {"Don't have an account? Sign Up"}
              </Link>
            </Stack>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
