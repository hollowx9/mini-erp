import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setAuthLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await API.post("/auth/login", {
      email,
      password,
      rememberMe,
    });

    const { token, user } = response.data;

    const storage = rememberMe ? localStorage : sessionStorage;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(user));

    setUser(user);

    return user;
  };

  const register = async (registerData) => {
    const response = await API.post("/auth/register", registerData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, authLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};