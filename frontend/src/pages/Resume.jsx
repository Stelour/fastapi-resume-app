import { useEffect, useState } from "react";
import { createResume, getResumes } from "../api";
import "../styles/resume.css";
import { Link } from "react-router-dom";

export default function Resume() {
  const [formData, setFormData] = useState({
    full_name: "",
    short_profile: "",
    skills: "",
    experience: "",
    strengths: "",
    additional_info: "",
  });

  const [resumes, setResumes] = useState([]);
  const [message, setMessage] = useState("");

  const loadResumes = async () => {
    try {
      const data = await getResumes();
      setResumes(data);
    } catch {
      setMessage("Не удалось загрузить резюме");
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await createResume(formData);
      setMessage("Резюме успешно создано");
      setFormData({
        full_name: "",
        short_profile: "",
        skills: "",
        experience: "",
        strengths: "",
        additional_info: "",
      });
      loadResumes();
    } catch {
      setMessage("Ошибка при создании резюме");
    }
  };

  return (
    <div className="resume-container">
      <h2>Создание резюме</h2>

      <form className="resume-form" onSubmit={handleSubmit}>
        <input
          name="full_name"
          placeholder="ФИО"
          value={formData.full_name}
          onChange={handleChange}
          required
        />

        <textarea
          name="short_profile"
          placeholder="Краткий профиль"
          value={formData.short_profile}
          onChange={handleChange}
          required
        />

        <textarea
          name="skills"
          placeholder="Навыки"
          value={formData.skills}
          onChange={handleChange}
          required
        />

        <textarea
          name="experience"
          placeholder="Опыт работы"
          value={formData.experience}
          onChange={handleChange}
          required
        />

        <textarea
          name="strengths"
          placeholder="Сильные стороны"
          value={formData.strengths}
          onChange={handleChange}
          required
        />

        <textarea
          name="additional_info"
          placeholder="Дополнительная информация"
          value={formData.additional_info}
          onChange={handleChange}
        />

        <button type="submit">Сохранить резюме</button>
      </form>

      {message && <p className="auth-message">{message}</p>}

      <div className="resume-list">
        <h2>Все резюме</h2>

        {resumes.map((resume) => (
          <Link key={resume.id} to={`/resumes/${resume.id}`}>
            <div className="resume-card">
              <p>
                <span className="resume-label">ID:</span> {resume.id}
              </p>
              <p>
                <span className="resume-label">Профиль:</span> {resume.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}