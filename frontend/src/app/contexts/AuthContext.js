"use client";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include"
        });

        const data = await response.json();
        if (response.ok && data?.success && data?.data?.user) {
          setUser(data.data.user);
          setToken(data.data.token || null);
          localStorage.setItem("user", JSON.stringify(data.data.user));
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem("user");
        }
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setToken(data.data.token || null);
        setUser(data.data.user);
        return { success: true, data: data.data };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Lỗi kết nối đến server" };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setToken(data.data.token || null);
        setUser(data.data.user);
        return { success: true, data: data.data };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: "Lỗi kết nối đến server" };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("cart");
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
