import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import UploadFile from "./components/UploadFile";
import SearchPage from "./pages/SearchPage";
import AllOrdersPage from "./pages/AllOrdersPage";
import OpenOrdersPage from "./pages/OpenOrdersPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Helper to hide Navbar on Login Page
function Layout({ children }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  return (
    <>
      {!isLogin && <Navbar />}
      <div className={!isLogin ? "container-main" : ""}>
        {children}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute> <Dashboard /> </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute> <UploadFile /> </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute> <SearchPage /> </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute> <AllOrdersPage /> </ProtectedRoute>
          } />
          <Route path="/open-orders" element={
            <ProtectedRoute> <OpenOrdersPage /> </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;