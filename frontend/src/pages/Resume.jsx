import { useEffect, useMemo, useState } from "react";
import { createResume, getResumes } from "../api";
import "../styles/resume.css";
import { Link } from "react-router-dom";

const EMPTY_FORM = {
  full_name: "",
  short_profile: "",
  skills: "",
  experience: "",
  strengths: "",
  additional_info: "",
};

export default function Resume() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resumes, setResumes] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadResumes = async () => {
    setLoadingList(true);
    try {
      const data = await getResumes();
      setResumes(Array.isArray(data) ? data : []);
      setMessage("");
    } catch {
      setMessage("Не удалось загрузить резюме");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const isValid = useMemo(() => {
    const required = ["full_name", "short_profile", "skills", "experience", "strengths"];
    return required.every((k) => String(formData[k] || "").trim().length > 0);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setMessage("");
    setSubmitting(true);

    try {
      await createResume({
        full_name: formData.full_name.trim(),
        short_profile: formData.short_profile.trim(),
        skills: formData.skills.trim(),
        experience: formData.experience.trim(),
        strengths: formData.strengths.trim(),
        additional_info: (formData.additional_info || "").trim(),
      });

      setMessage("Резюме успешно создано");
      setFormData(EMPTY_FORM);
      await loadResumes();
    } catch {
      setMessage("Ошибка при создании резюме");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCardSubtitle = (resume) => {
    const c = resume?.content;
    if (c && typeof c === "object") {
      const fullName = c.full_name ? String(c.full_name) : "";
      const shortProfile = c.short_profile ? String(c.short_profile) : "";
      return (
        <>
          {fullName && <div><span className="resume-label">ФИО:</span> {fullName}</div>}
          {(resume?.title || shortProfile) && (
            <div><span className="resume-label">Профиль:</span> {resume?.title || shortProfile}</div>
          )}
        </>
      );
    }

    return (
      <div>
        <span className="resume-label">Профиль:</span> {resume?.title || "-"}
      </div>
    );
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
          rows={3}
        />

        <textarea
          name="skills"
          placeholder="Навыки"
          value={formData.skills}
          onChange={handleChange}
          required
          rows={4}
        />

        <textarea
          name="experience"
          placeholder="Опыт и проекты"
          value={formData.experience}
          onChange={handleChange}
          required
          rows={6}
        />

        <textarea
          name="strengths"
          placeholder="Сильные стороны"
          value={formData.strengths}
          onChange={handleChange}
          required
          rows={4}
        />

        <textarea
          name="additional_info"
          placeholder="Дополнительная информация"
          value={formData.additional_info}
          onChange={handleChange}
          rows={3}
        />

        <button type="submit" disabled={!isValid || submitting}>
          {submitting ? "Сохраняю..." : "Сохранить резюме"}
        </button>
      </form>

      {message && <p className="auth-message">{message}</p>}

      <div className="resume-list">
        <h2>Все резюме</h2>

        {loadingList ? (
          <p>Загрузка...</p>
        ) : resumes.length === 0 ? (
          <p>Пока нет резюме</p>
        ) : (
          resumes.map((resume) => (
            <Link key={resume.id} to={`/resumes/${resume.id}`}>
              <div className="resume-card">
                <div>
                  <span className="resume-label">ID:</span> {resume.id}
                </div>
                {renderCardSubtitle(resume)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
