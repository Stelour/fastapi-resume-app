import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getResumeById,
  updateResume,
  deleteResume,
  improveResumePreview,
  improveResumeCommit,
  getResumeHistory,
} from "../api";
import "../styles/resume.css";

export default function ResumeDetail() {
  const { resume_id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [improvedResume, setImprovedResume] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadResume();
    loadHistory();
  }, []);

  const loadResume = async () => {
    try {
      const data = await getResumeById(resume_id);
      setResume(data);
    } catch {
      setMessage("Резюме не найдено или нет доступа");
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getResumeHistory(resume_id);
      setHistory(data);
    } catch {
      setMessage("Не удалось загрузить историю");
    }
  };

  const handleChange = (e) => {
    setResume({ ...resume, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await updateResume(resume_id, resume);
      setMessage("Резюме обновлено");
      setIsEditing(false);
      loadHistory();
    } catch {
      setMessage("Ошибка обновления");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Удалить резюме?")) return;
    try {
      await deleteResume(resume_id);
      navigate("/resume");
    } catch {
      setMessage("Ошибка удаления");
    }
  };

  // ===== Работа с улучшением =====
  const handleImprovePreview = async () => {
    try {
      const data = await improveResumePreview(resume_id);
      setImprovedResume(data);
    } catch {
      setMessage("Ошибка при улучшении резюме");
    }
  };

  const handleImproveCommit = async (commit) => {
    try {
      await improveResumeCommit(resume_id, commit ? 1 : 0);
      setMessage(commit ? "Резюме сохранено" : "Изменения отклонены");
      setImprovedResume(null);
      loadResume();
      loadHistory();
    } catch {
      setMessage("Ошибка при commit улучшения");
    }
  };

  const handleDeleteImprovement = async (id) => {
    if (!window.confirm("Удалить это улучшение?")) return;

    try {
      await deleteImprovement(id);
      setMessage("Улучшение удалено");
      loadHistory(); // обновляем историю после удаления
    } catch {
      setMessage("Ошибка удаления улучшения");
    }
  };

  if (!resume) return <p style={{ textAlign: "center" }}>{message}</p>;

  return (
    <div className="resume-container">
      <h2>Резюме #{resume_id}</h2>

      <div className="resume-form">
        {Object.entries(resume).map(([key, value]) =>
          key === "id" ? null : (
            <textarea
              key={key}
              name={key}
              value={value || ""}
              onChange={handleChange}
              disabled={!isEditing}
            />
          )
        )}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}>Редактировать</button>
        ) : (
          <button onClick={handleUpdate}>Сохранить</button>
        )}

        <button onClick={handleDelete} style={{ background: "#e53e3e" }}>
          Удалить
        </button>

        <button onClick={handleImprovePreview} style={{ background: "#38a169" }}>
          Улучшить (Preview)
        </button>
      </div>

      {improvedResume && (
        <div style={{ marginTop: 20, border: "1px solid #38a169", padding: 15, borderRadius: 8 }}>
          <h3>Предварительное улучшение</h3>
          {Object.entries(improvedResume).map(([key, value]) =>
            key === "id" ? null : (
              <p key={key}><strong>{key}:</strong> {value}</p>
            )
          )}
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button onClick={() => handleImproveCommit(1)} style={{ background: "#38a169" }}>
              Сохранить
            </button>
            <button onClick={() => handleImproveCommit(0)} style={{ background: "#e53e3e" }}>
              Отклонить
            </button>
          </div>
        </div>
      )}

      {message && <p className="auth-message">{message}</p>}

      <div className="resume-list" style={{ marginTop: 40 }}>
        <h2>История изменений</h2>
        {history.length === 0 ? (
          <p>История пуста</p>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="resume-card">
              {Object.entries(item).map(([key, value]) =>
                key === "id" ? null : (
                  <p key={key}><strong>{key}:</strong> {value}</p>
                )
              )}
              <button
                onClick={() => handleDeleteImprovement(item.id)}
                style={{ background: "#e53e3e", marginTop: 5 }}
              >
                Удалить улучшение
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}