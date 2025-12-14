import { Link } from "react-router-dom";
import "./auth.css";

function Login() {
  return (
    <div className="auth-container">
      <form className="auth-form">
        <h2 className="auth-title">Вход</h2>

        <div className="auth-field">
          <label>Email / Логин</label>
          <input type="text" name="email" placeholder="Введите email или логин" />
        </div>

        <div className="auth-field">
          <label>Пароль</label>
          <input type="password" name="password" placeholder="Введите пароль" />
        </div>

        <button type="submit" className="auth-button">
          Войти
        </button>

        <div className="auth-link">
          <Link to="/auth/registration">Регистрация</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
