import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import useUserStore from "./store/useUserStore";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/auth";

// Calls the backend to verify the auth_token cookie.
// Returns { isAuthenticated: true, user } on success,
// or { isAuthenticated: false } on any failure (expired/missing/invalid cookie).
const checkUserAuth = async () => {
  try {
    const res = await axios.get(`${API_BASE}/check-auth`, {
      withCredentials: true, // required so the auth_token cookie is sent
    });
    const user = res.data?.data ?? res.data?.user ?? res.data;
    return { isAuthenticated: true, user };
  } catch (error) {
    return { isAuthenticated: false };
  }
};

export const ProtectedRoute = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const { isAuthenticated, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await checkUserAuth();
        if (result?.isAuthenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error) {
        console.error(error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, [setUser, clearUser]);

  if (isChecking) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  // user is authenticated — render the protected route
  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Small inline loader so this file has no missing dependency.
// Swap this out for your own loading component/spinner if you have one.
const Loader = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
    }}
  >
    <span>Checking your session…</span>
  </div>
);