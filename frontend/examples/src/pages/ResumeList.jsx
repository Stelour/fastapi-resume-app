import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./resume.css";

function ResumeList() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/resume/")
      .then((res) => res.json())
      .then((data) => {
        setResumes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="resume-container">
      <h2 className="resume-page-title">Мои резюме</h2>

      <div className="resume-list">
        {loading && <p className="resume-empty">Загрузка...</p>}

        {!loading && resumes.length === 0 && (
          <p className="resume-empty">Резюме пока нет</p>
        )}

        {resumes.map((resume) => (
          <div key={resume.id} className="resume-item">
            <Link to={`/resume/${resume.id}`} className="resume-link">
              {resume.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResumeList;
