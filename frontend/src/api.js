const API_URL = "http://localhost:8000";

export async function registerUser(data) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Registration error");
  }

  return response.json();
}

export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Login error");
  }

  return response.json();
}

export async function createResume(resumeData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resumeData),
  });

  if (!response.ok) {
    throw new Error("Ошибка при создании резюме");
  }

  return response.json();
}

export async function getResumes() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/resume`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Ошибка при получении резюме");
  }

  return response.json();
}

function authHeaders(json = false) {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    ...(json && { "Content-Type": "application/json" }),
  };
}

// GET /resume/{id}
export async function getResumeById(id) {
  const res = await fetch(`${API_URL}/resume/${id}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Резюме не найдено");
  return res.json();
}

// PATCH /resume/{id}
export async function updateResume(id, data) {
  const res = await fetch(`${API_URL}/resume/${id}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Ошибка обновления резюме");
  return res.json();
}

// DELETE /resume/{id}
export async function deleteResume(id) {
  const res = await fetch(`${API_URL}/resume/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Ошибка удаления резюме");
}

export async function improveResumePreview(id) {
  const res = await fetch(`${API_URL}/resume/${id}/improve/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("Ошибка улучшения резюме");
  return res.json(); // JSON с улучшенным резюме
}

// POST /resume/{id}/improve/commit
export async function improveResumeCommit(id, commit) {
  const res = await fetch(`${API_URL}/resume/${id}/improve/commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commit }), // 0 или 1
  });
  if (!res.ok) throw new Error("Ошибка commit улучшения");
  return res.json();
}

// GET /resume/{id}/history
export async function getResumeHistory(id) {
  const res = await fetch(`${API_URL}/resume/${id}/history`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("Ошибка получения истории");
  return res.json(); // массив резюме
}

export async function deleteImprovement(improvement_id) {
  const res = await fetch(`${API_URL}/improvements/${improvement_id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  if (!res.ok) throw new Error("Ошибка удаления улучшения");
}