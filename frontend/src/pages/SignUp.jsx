import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Button,
  TextField,
  Link,
  Box,
  Typography,
  Container,
  Avatar,
  CssBaseline,
  Card,
  FormControl,
  FormLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getInviteEmail, signup, signupInvite, sendVerificationCode } from "../api/auth";
import { useSnackbar } from "../utils/SnackbarContext";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    background: { default: "#f5f7fa" },
  },
  typography: {
    h4: { fontWeight: 700 },
    body2: { fontSize: "0.9rem" },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: "8px" } },
      },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: "8px", textTransform: "none" } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } },
    },
  },
});

const FIELD_ROW_SX = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "flex-start", sm: "center" },
  gap: { xs: 1, sm: 2 },
};

const LABEL_SX = {
  minWidth: { xs: "auto", sm: 100 },
  fontWeight: 500,
  mb: { xs: 0.5, sm: 0 },
};

export default function SignUp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // ── form fields ──────────────────────────────────────────────────────────
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState("");
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── invite mode ───────────────────────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [isInviteMode, setIsInviteMode] = useState(false);

  // ── verification step ─────────────────────────────────────────────────────
  // "form" → filling details; "verify" → entering the 6-digit code
  const [step, setStep] = useState("form");
  const [pendingFormData, setPendingFormData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    if (token) {
      setIsInviteMode(true);
      getInviteEmail(token)
        .then(({ data }) => setInviteEmail(data))
        .catch((err) => console.error("Error fetching invite email:", err));
      setInviteToken(token);
    }
  }, [location.search]);

  // ── validation ────────────────────────────────────────────────────────────
  const validateInputs = () => {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const name = document.getElementById("name");
    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage("Name is required.");
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage("");
    }

    return isValid;
  };

  // ── step 1: send verification code ───────────────────────────────────────
  const handleSendCode = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (isInviteMode) {
      formData.token = inviteToken;
      formData.email = inviteEmail;
    }

    // Invite flow: skip email verification — invite token already proves ownership
    if (isInviteMode) {
      setPendingFormData(formData);
      await handleCreateAccount(formData);
      return;
    }

    setIsLoading(true);
    try {
      const { response, data } = await sendVerificationCode(formData.email);
      if (!response.ok) {
        showSnackbar(data.detail || "Failed to send verification code.", "error");
        return;
      }
      setPendingFormData(formData);
      setStep("verify");
      showSnackbar(`Verification code sent to ${formData.email}`);
    } catch (err) {
      showSnackbar("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── step 2: verify code + create account ─────────────────────────────────
  const handleVerifyAndCreate = async (event) => {
    event.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError(true);
      return;
    }
    setCodeError(false);
    await handleCreateAccount({ ...pendingFormData, verification_code: verificationCode });
  };

  const handleCreateAccount = async (payload) => {
    setIsLoading(true);
    try {
      const { response, data } = isInviteMode
        ? await signupInvite(payload)
        : await signup(payload);

      if (response.ok) {
        showSnackbar(data.message || "Account created successfully!");
        navigate("/signin");
      } else {
        showSnackbar(data.detail || "Sign up failed.", "error");
        // If the code was wrong/expired, go back to the code step
        if (step === "verify") setVerificationCode("");
      }
    } catch (err) {
      showSnackbar("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingFormData?.email) return;
    setIsLoading(true);
    try {
      const { response, data } = await sendVerificationCode(pendingFormData.email);
      if (response.ok) {
        showSnackbar("New verification code sent!");
        setVerificationCode("");
      } else {
        showSnackbar(data.detail || "Failed to resend code.", "error");
      }
    } catch {
      showSnackbar("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        component="main"
        maxWidth="md"
        sx={{ display: "flex", alignItems: "center", bgcolor: "background.default" }}
      >
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
          <Card variant="outlined" sx={{ padding: { xs: 3, sm: 4 }, width: "100%", maxWidth: 700, textAlign: "center" }}>

            {step === "form" && (
              <>
                <Avatar sx={{ m: "auto", bgcolor: "primary.main", mb: 2, width: 48, height: 48 }}>
                  <LockOutlinedIcon fontSize="large" />
                </Avatar>
                <Typography component="h1" variant="h4" sx={{ mb: 3, color: "text.primary" }}>
                  Sign Up
                </Typography>

                <Box component="form" onSubmit={handleSendCode} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <FormControl sx={FIELD_ROW_SX}>
                    <FormLabel sx={LABEL_SX}>Full Name</FormLabel>
                    <TextField
                      fullWidth id="name" placeholder="Jon Snow" name="name"
                      autoComplete="name" error={nameError} helperText={nameErrorMessage} variant="outlined"
                    />
                  </FormControl>

                  <FormControl sx={FIELD_ROW_SX}>
                    <FormLabel sx={LABEL_SX}>Institution</FormLabel>
                    <TextField fullWidth id="institution" placeholder="University of ..." name="institution" variant="outlined" />
                  </FormControl>

                  <FormControl sx={FIELD_ROW_SX}>
                    <FormLabel sx={LABEL_SX}>Position</FormLabel>
                    <TextField fullWidth id="position" placeholder="Student" name="position" variant="outlined" />
                  </FormControl>

                  <FormControl sx={FIELD_ROW_SX}>
                    <FormLabel sx={LABEL_SX}>Zoom Link</FormLabel>
                    <TextField fullWidth id="zoom" placeholder="zoom.com" name="zoom" variant="outlined" />
                  </FormControl>

                  <FormControl sx={FIELD_ROW_SX}>
                    <FormLabel sx={LABEL_SX}>Email</FormLabel>
                    <TextField
                      fullWidth id="email" placeholder="your@email.com" name="email"
                      autoComplete="email" variant="outlined" error={emailError} helperText={emailErrorMessage}
                      value={isInviteMode ? inviteEmail : undefined}
                      InputProps={isInviteMode ? { readOnly: true } : {}}
                    />
                  </FormControl>

                  <FormControl sx={FIELD_ROW_SX}>
                    <FormLabel sx={LABEL_SX}>Password</FormLabel>
                    <TextField
                      fullWidth name="password" placeholder="••••••"
                      type={showPassword ? "text" : "password"} id="password"
                      autoComplete="new-password" variant="outlined"
                      error={passwordError} helperText={passwordErrorMessage}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword((p) => !p)}
                                onMouseDown={(e) => e.preventDefault()}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </FormControl>

                  <Button
                    type="submit" fullWidth variant="contained" disabled={isLoading}
                    sx={{ mt: 3, py: 1.5, fontSize: "1rem", fontWeight: "bold" }}
                  >
                    {isLoading
                      ? <CircularProgress size={24} color="inherit" />
                      : isInviteMode ? "Create Account" : "Send Verification Code"
                    }
                  </Button>

                  <Typography sx={{ textAlign: "center", mt: 2, color: "text.secondary" }}>
                    Already have an account?{" "}
                    <Link href="/signin" variant="body2" sx={{ color: "primary.main", fontWeight: 500 }}>
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </>
            )}

            {step === "verify" && (
              <>
                <Avatar sx={{ m: "auto", bgcolor: "success.main", mb: 2, width: 48, height: 48 }}>
                  <MarkEmailReadIcon fontSize="large" />
                </Avatar>
                <Typography component="h1" variant="h4" sx={{ mb: 1, color: "text.primary" }}>
                  Check Your Email
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  We sent a 6-digit code to <strong>{pendingFormData?.email}</strong>.
                  <br />It expires in 10 minutes.
                </Typography>

                <Box component="form" onSubmit={handleVerifyAndCreate} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Verification Code"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setCodeError(false);
                    }}
                    error={codeError}
                    helperText={codeError ? "Please enter the 6-digit code." : ""}
                    inputProps={{ inputMode: "numeric", maxLength: 6 }}
                    variant="outlined"
                    sx={{ "& input": { textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.3em" } }}
                  />

                  <Button
                    type="submit" fullWidth variant="contained" disabled={isLoading}
                    sx={{ mt: 1, py: 1.5, fontSize: "1rem", fontWeight: "bold" }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
                  </Button>

                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                    <Link
                      component="button" type="button" variant="body2"
                      onClick={() => { setStep("form"); setVerificationCode(""); }}
                      sx={{ color: "text.secondary" }}
                    >
                      ← Back
                    </Link>
                    <Link
                      component="button" type="button" variant="body2"
                      onClick={handleResendCode} disabled={isLoading}
                      sx={{ color: "primary.main", fontWeight: 500 }}
                    >
                      Resend code
                    </Link>
                  </Box>
                </Box>
              </>
            )}

          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
