import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/user-login/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import HomePage from './components/HomePage';
import UserDetail from './components/UserDetail';
import Status from './pages/StatusSection/Status';
import Setting from './pages/SettingSection/Setting';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          {/* Public-only routes: a logged-in user gets bounced to "/" instead of seeing login again */}
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          {/* Protected routes: require a valid session, otherwise redirect to /user-login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetail />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>

          {/* Fallback: unknown paths go to login, ProtectedRoute/PublicRoute will sort out where they really land */}
          <Route path="*" element={<Navigate to="/user-login" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;