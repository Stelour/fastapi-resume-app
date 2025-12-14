import { Link } from "react-router-dom";
import "./auth.css";

function Register() {
  return (
    <div className="auth-container">
      <form className="auth-form">
        <h2 className="auth-title">Регистрация</h2>

        <div className="auth-field">
          <label>Email</label>
          <input type="email" name="email" placeholder="Введите email" />
        </div>

        <div className="auth-field">
          <label>Имя пользователя</label>
          <input type="text" name="username" placeholder="Введите имя пользователя" />
        </div>

        <div className="auth-field">
          <label>Пароль</label>
          <input type="password" name="password" placeholder="Введите пароль" />
        </div>

        <div className="auth-field">
          <label>Повторите пароль</label>
          <input type="password" name="repeatPassword" placeholder="Повторите пароль" />
        </div>

        <button type="submit" className="auth-button">
          Зарегистрироваться
        </button>

        <div className="auth-link">
          <Link to="/auth/login">Войти</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
