import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Function to check token validity and set user info
  const checkToken = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const isExpired = decodedToken.exp * 1000 < Date.now();

        if (!isExpired) {
          // Get user info from localStorage
          const userInfo = localStorage.getItem("user_info");
          if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            setUser({
              ...parsedUser,
              role: getUserRole(parsedUser.position),
            });
          }
          setIsAuthenticated(true);
          return true;
        } else {
          handleLogout();
          return false;
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        handleLogout();
        return false;
      }
    }
    setIsAuthenticated(false);
    setUser(null);
    return false;
  };

  useEffect(() => {
    checkToken();
    setLoading(false);
  }, []);

  const getUserRole = (position) => {
    // Map positions to roles
    const positionToRole = {
      admin: "ADMIN",
      researcher: "USER",
      // Add other position mappings as needed
    };

    return positionToRole[position.toLowerCase()] || "USER";
  };

  const handleLogin = (token, userInfo) => {
    const userWithRole = {
      ...userInfo,
      role: getUserRole(userInfo.position),
    };

    localStorage.setItem("access_token", token);
    localStorage.setItem("user_info", JSON.stringify(userInfo));
    setIsAuthenticated(true);
    setUser(userWithRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    setIsAuthenticated(false);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.position === "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        handleLogin,
        handleLogout,
        checkToken,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
