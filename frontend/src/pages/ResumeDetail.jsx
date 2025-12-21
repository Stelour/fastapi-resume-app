import { useEffect, useMemo, useState } from "react";
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
  getImprovePreview,
} from "../api";

const EMPTY_FORM = {
  short_profile: "",
  skills: "",
  experience: "",
  strengths: "",
  additional_info: "",
};

function normalizeContent(content) {
  const c = content && typeof content === "object" ? content : {};
  return {
    full_name: c.full_name || "",
    short_profile: c.short_profile || "",
    skills: c.skills || "",
    experience: c.experience || "",
    strengths: c.strengths || "",
    additional_info: c.additional_info || "",
  };
}

function renderContent(c) {
  if (!c) return null;
  const n = normalizeContent(c);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <b>ФИО:</b>
        <div style={{ whiteSpace: "pre-wrap" }}>{n.full_name || "-"}</div>
      </div>

      <div>
        <b>Краткий профиль:</b>
        <div style={{ whiteSpace: "pre-wrap" }}>{n.short_profile || "-"}</div>
      </div>

      <div>
        <b>Ключевые навыки:</b>
        <div style={{ whiteSpace: "pre-wrap" }}>{n.skills || "-"}</div>
      </div>

      <div>
        <b>Опыт и проекты:</b>
        <div style={{ whiteSpace: "pre-wrap" }}>{n.experience || "-"}</div>
      </div>

      <div>
        <b>Сильные стороны:</b>
        <div style={{ whiteSpace: "pre-wrap" }}>{n.strengths || "-"}</div>
      </div>

      {n.additional_info ? (
        <div>
          <b>Дополнительная информация:</b>
          <div style={{ whiteSpace: "pre-wrap" }}>{n.additional_info}</div>
        </div>
      ) : null}
    </div>
  );
}

export default function ResumeDetail() {
  const { resume_id } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [fio, setFio] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [previewContent, setPreviewContent] = useState(null);
  const [hasPreview, setHasPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [history, setHistory] = useState([]);

  const isSaveDisabled = useMemo(() => {
    const required = ["short_profile", "skills", "experience", "strengths"];
    const okForm = required.every((k) => String(form[k] || "").trim().length > 0);
    const okFio = String(fio || "").trim().length > 0;
    return !(okForm && okFio);
  }, [form, fio]);

  const loadAll = async () => {
    setMessage("");
    setLoading(true);

    try {
      const r = await getResumeById(resume_id);

      const c = normalizeContent(r?.content);
      setFio(c.full_name);
      setForm({
        short_profile: c.short_profile,
        skills: c.skills,
        experience: c.experience,
        strengths: c.strengths,
        additional_info: c.additional_info,
      });

      setTitle(r?.title || c.short_profile || "");

      try {
        const p = await getImprovePreview(resume_id);
        if (p?.improved_content && typeof p.improved_content === "object") {
          setPreviewContent(p.improved_content);
          setHasPreview(true);
        } else {
          setPreviewContent(null);
          setHasPreview(false);
        }
      } catch {
        setPreviewContent(null);
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
    if (isSaveDisabled) return;

    try {
      await updateResume(resume_id, {
        full_name: fio.trim(),
        short_profile: form.short_profile.trim(),
        skills: form.skills.trim(),
        experience: form.experience.trim(),
        strengths: form.strengths.trim(),
        additional_info: (form.additional_info || "").trim(),
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
      if (res?.improved_content && typeof res.improved_content === "object") {
        setPreviewContent(res.improved_content);
        setHasPreview(true);
        setMessage("Preview готов");
      } else {
        setPreviewContent(null);
        setHasPreview(false);
        setMessage("Preview пустой/некорректный");
      }
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
          <button type="button" onClick={onSave} disabled={isSaveDisabled}>
            Сохранить
          </button>
          <button type="button" onClick={onDelete} style={{ background: "#d9534f" }}>
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

      <div style={{ marginTop: 28 }}>
        <h2>История изменений</h2>

        {hasPreview && (
          <div className="resume-card" style={{ border: "2px solid #4caf50", marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>Preview улучшения</h3>

            <div style={{ marginBottom: 12 }}>{renderContent(previewContent)}</div>

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

              <div style={{ marginTop: 10 }}>{renderContent(h.improved_content)}</div>

              <button type="button" onClick={() => onDeleteImprovement(h.id)} style={{ marginTop: 12 }}>
                Удалить улучшение
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
