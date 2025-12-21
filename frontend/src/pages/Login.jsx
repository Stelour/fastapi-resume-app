import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.access_token);
      setMessage("Вход выполнен успешно");
      setIsError(false);
      navigate("/resumes/");
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  return (
    <div className="auth_page">
      <div className="auth-container">
        <h2>Вход</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Войти</button>
        </form>

        {message && (
          <p className={`auth-message ${isError ? "error" : "success"}`}>
            {message}
          </p>
        )}

        <div className="auth-link">
          Нет аккаунта? <Link to="/auth/register">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
