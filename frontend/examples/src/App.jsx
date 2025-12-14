import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import ResumeList from "./pages/ResumeList.jsx";
import ResumeView from "./pages/ResumeView.jsx";


function App() {
return (
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Navigate to="/auth/login" />} />
    <Route path="/auth/login" element={<Login />} />
    <Route path="/auth/registration" element={<Register />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/resume" element={<ResumeList />} />
    <Route path="/resume/:id" element={<ResumeView />} />
  </Routes>
</BrowserRouter>
);
}


export default App;