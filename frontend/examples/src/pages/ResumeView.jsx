import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./resume.css";

function ResumeView() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/resume/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setResume(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="resume-empty">Загрузка...</p>;
  if (!resume) return <p className="resume-empty">Резюме не найдено</p>;

  return (
    <div className="resume-container">
      <div className="resume-card">
        <h2 className="resume-title">{resume.title}</h2>
        <div className="resume-content">{resume.content}</div>
      </div>
    </div>
  );
}

export default ResumeView;
