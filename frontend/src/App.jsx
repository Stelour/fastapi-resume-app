import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Resume from "./pages/Resume.jsx";
import ResumeDetail from "./pages/ResumeDetail.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/resume/:resume_id" element={<ResumeDetail />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;