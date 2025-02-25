import react from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Faturas from "./pages/Fatura";
import Register from "./pages/Register";
import Home from "./pages/Home";
import InserirFatura from "./pages/CreateFatura";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login"></Navigate>;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
     <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
        <Route
          path="/faturas"
          element={
            <ProtectedRoute>
              <Faturas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inserirFatura"
          element={
            <ProtectedRoute>
              <InserirFatura />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
