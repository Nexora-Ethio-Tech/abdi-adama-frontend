import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "./HighSchoolLanding";
import AboutUs from "./components/AboutUs";
import ProgramsPage from "./components/ProgramsPage";
import BranchesPage from "./components/BranchesPage";
import Navbar from "./components/Navbar";
import { LanguageProvider } from "./context/LanguageContext";
import Footer from "./components/Footer";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function LandingPage() {
  return (
    <LanguageProvider>
      <ScrollToTop />
      <div className="bg-zinc-950 min-h-screen text-zinc-50 antialiased selection:bg-amber-500/20 selection:text-white font-sans">
        <Navbar />
        <Routes>
          {/* 2. Routes here are now relative to the parent path */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/branches" element={<BranchesPage />} />
        </Routes>
        <Footer />
      </div>
    </LanguageProvider>
  );
}