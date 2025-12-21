import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/resume.css";

import {
  getResumeById,
  updateResume,
  deleteResume,
  improveResumePreview,
  improveResumeCommit,
  getResumeHistory,
  deleteImprovement,
  getImprovePreview
} from "../api";

function parseContent(content = "") {
  const sections = {
    short_profile: "",
    skills: "",
    experience: "",
    strengths: "",
    additional_info: "",
  };

  const map = [
    { key: "short_profile", title: "Краткий профиль" },
    { key: "skills", title: "Ключевые навыки" },
    { key: "experience", title: "Опыт и проекты" },
    { key: "strengths", title: "Сильные стороны" },
    { key: "additional_info", title: "Дополнительная информация" },
  ];

  for (let i = 0; i < map.length; i++) {
    const cur = map[i];
    const next = map[i + 1];

    const startMarker = `**${cur.title}:**`;
    const start = content.indexOf(startMarker);
    if (start === -1) continue;

    const afterStart = content.slice(start + startMarker.length);
    const end = next ? afterStart.indexOf(`**${next.title}:**`) : -1;

    const chunk = end === -1 ? afterStart : afterStart.slice(0, end);
    sections[cur.key] = chunk.replace(/^\s*[\r\n]+/, "").trim();
  }

  return sections;
}

export default function ResumeDetail() {
  const { resume_id } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");

  const [fio, setFio] = useState("");
  const [form, setForm] = useState({
    short_profile: "",
    skills: "",
    experience: "",
    strengths: "",
    additional_info: "",
  });

  const [previewText, setPreviewText] = useState("");
  const [hasPreview, setHasPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setMessage("");
    setLoading(true);

    try {
      const r = await getResumeById(resume_id);
      setFio(r.title || "");
      setForm(parseContent(r.content || ""));

      try {
        const p = await getImprovePreview(resume_id);
        if (p?.improved_content) {
          setPreviewText(p.improved_content);
          setHasPreview(true);
        } else {
          setPreviewText("");
          setHasPreview(false);
        }
      } catch (e) {
        setPreviewText("");
        setHasPreview(false);
      }

      const h = await getResumeHistory(resume_id);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) {
      setMessage(e?.message || "Ошибка загрузки резюме");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [resume_id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSave = async () => {
    setMessage("");
    try {
      await updateResume(resume_id, {
        full_name: fio,
        short_profile: form.short_profile,
        skills: form.skills,
        experience: form.experience,
        strengths: form.strengths,
        additional_info: form.additional_info,
      });

      setMessage("Сохранено");
      await loadAll();
    } catch (e) {
      setMessage(e?.message || "Ошибка сохранения");
    }
  };

  const onDelete = async () => {
    if (!confirm("Удалить резюме?")) return;
    setMessage("");

    try {
      await deleteResume(resume_id);
      navigate("/resumes");
    } catch (e) {
      setMessage(e?.message || "Ошибка удаления резюме");
    }
  };

  const onGeneratePreview = async () => {
    setMessage("");
    setPreviewLoading(true);

    try {
      const res = await improveResumePreview(resume_id);
      setPreviewText(res?.improved_content || "");
      setHasPreview(true);
      setMessage("Preview готов");
    } catch (e) {
      setMessage(e?.message || "Ошибка улучшения (preview)");
    } finally {
      setPreviewLoading(false);
    }
  };

  const onCommitPreview = async (confirmValue) => {
    setMessage("");
    try {
      await improveResumeCommit(resume_id, confirmValue);
      await loadAll();
      setMessage(confirmValue ? "Улучшение сохранено" : "Улучшение отменено");
    } catch (e) {
      setMessage(e?.message || "Ошибка commit");
    }
  };

  const onDeleteImprovement = async (improvementId) => {
    if (!confirm("Удалить улучшение?")) return;
    setMessage("");

    try {
      await deleteImprovement(improvementId);
      await loadAll();
    } catch (e) {
      setMessage(e?.message || "Ошибка удаления улучшения");
    }
  };

  return (
    <div className="resume-container">
      <h2>Резюме #{resume_id}</h2>

      {message && <p className="auth-message">{message}</p>}
      {loading && <p>Загрузка...</p>}

      <div className="resume-form">
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
          ФИО
        </label>
        <input
          value={fio}
          onChange={(e) => setFio(e.target.value)}
          placeholder="Например: Олег Олегович"
          style={{ maxWidth: 420 }}
        />

        <label style={{ display: "block", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
          Краткий профиль
        </label>
        <textarea
          name="short_profile"
          value={form.short_profile}
          onChange={onChange}
          rows={3}
          placeholder="Например: Java Backend Developer"
        />

        <label style={{ display: "block", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
          Ключевые навыки
        </label>
        <textarea
          name="skills"
          value={form.skills}
          onChange={onChange}
          rows={4}
          placeholder="Например: Spring, PostgreSQL, Docker..."
        />

        <label style={{ display: "block", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
          Опыт и проекты
        </label>
        <textarea
          name="experience"
          value={form.experience}
          onChange={onChange}
          rows={6}
          placeholder="Где работал, что делал, какие проекты"
        />

        <label style={{ display: "block", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
          Сильные стороны
        </label>
        <textarea
          name="strengths"
          value={form.strengths}
          onChange={onChange}
          rows={4}
          placeholder="Например: ответственность, коммуникация..."
        />

        <label style={{ display: "block", marginTop: 14, marginBottom: 6, fontWeight: 600 }}>
          Дополнительная информация
        </label>
        <textarea
          name="additional_info"
          value={form.additional_info}
          onChange={onChange}
          rows={3}
          placeholder="Город, язык, ссылки, прочее"
        />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button type="button" onClick={onSave}>Сохранить</button>
          <button
            type="button"
            onClick={onDelete}
            style={{ background: "#d9534f" }}
          >
            Удалить
          </button>
          <button
            type="button"
            onClick={onGeneratePreview}
            disabled={previewLoading}
            style={{
              background: previewLoading ? "#9e9e9e" : "#4caf50",
              cursor: previewLoading ? "not-allowed" : "pointer",
              opacity: previewLoading ? 0.7 : 1,
            }}
          >
            {previewLoading ? "Улучшаю..." : "Улучшить (Preview)"}
          </button>
        </div>
      </div>

      {}
      <div style={{ marginTop: 28 }}>
        <h2>История изменений</h2>

        {hasPreview && (
          <div className="resume-card" style={{ border: "2px solid #4caf50", marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>Preview улучшения</h3>
            <pre style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>
              {previewText}
            </pre>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => onCommitPreview(true)}>
                Сохранить улучшение
              </button>
              <button type="button" onClick={() => onCommitPreview(false)}>
                Отменить
              </button>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <p>История пуста</p>
        ) : (
          history.map((h) => (
            <div key={h.id} className="resume-card" style={{ marginBottom: 12 }}>
              <p style={{ marginTop: 0 }}>
                <b>Улучшение #{h.id}</b>
              </p>
              <pre style={{ whiteSpace: "pre-wrap" }}>{h.improved_content}</pre>
              <button type="button" onClick={() => onDeleteImprovement(h.id)}>
                Удалить улучшение
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
