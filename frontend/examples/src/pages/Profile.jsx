import { useState } from "react";
import "./auth.css";

function Profile() {
  const [form, setForm] = useState({
    fullName: "",
    position: "",
    skills: "",
    experience: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Данные профиля:", form);
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Данные для резюме</h2>

        <div className="auth-field">
          <label>ФИО</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label>Желаемая должность</label>
          <input name="position" value={form.position} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label>Навыки</label>
          <textarea name="skills" value={form.skills} onChange={handleChange} />
        </div>

        <div className="auth-field">
          <label>Опыт / проекты</label>
          <textarea name="experience" value={form.experience} onChange={handleChange} />
        </div>

        <button type="submit" className="auth-button">
          Сформировать резюме
        </button>
      </form>
    </div>
  );
}

export default Profile;
