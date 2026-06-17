import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/user-login/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/user-login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;