import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api";
import "../styles/auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const data = await registerUser({ email, username, password });
      setMessage(data.message);
      setIsError(false);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Регистрация</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Зарегистрироваться</button>
        </form>

        {message && (
          <p className={`auth-message ${isError ? "error" : "success"}`}>
            {message}
          </p>
        )}

        <div className="auth-link">
          Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
        </div>
      </div>
    </div>
  );
}
