// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Provider, useDispatch } from "react-redux";
import appStore from "./utils/appStore";

import Navbar from "./components/Navbar";
import HomePage from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

import { BASE_URL } from "./utils/config";
import { addUser } from "./utils/userSlice";


// ✅ Import Toaster
import { Toaster } from "./components/Toaster";
import Dashboard from "./pages/Dashboard";

// ✅ Separate component that has access to Redux store
function AppContent() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/profile/view`, {
        credentials: "include",
      });
      const data = await response.json();
      dispatch(addUser(data)); // ✅ use dispatch, not appStore.dispatch
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchUser();
  }, []);

  return (
    <>
      {/* ✅ Put Toaster here so it's always available */}
      <Toaster />

      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <Provider store={appStore}>
      <Router>
        <div className="bg-base-100 min-h-screen">
        <AppContent />
        </div>
      </Router>
    </Provider>
  );
}
