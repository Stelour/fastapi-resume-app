# fastapi-resume-app

Пет-проект: сервис для хранения резюме и улучшения текста с помощью Gemini. Есть простой фронтенд на React и REST API на FastAPI с JWT-аутентификацией.

## Возможности
- регистрация и логин
- CRUD резюме
- улучшение текста резюме (preview + commit)
- история улучшений

## Стек
- Backend: FastAPI, SQLAlchemy (async), Alembic, PostgreSQL, PyJWT, Passlib, python-dotenv
- AI: Google Generative AI (Gemini)
- Frontend: React + Vite, React Router

## Быстрый старт

### 1) Переменные окружения
Создайте `.env` в корне проекта:

```
SQLALCHEMY_DATABASE_URI=postgresql+asyncpg://user:password@localhost:5432/resume_db
SECRET_KEY=your-secret
API_KEY=your-gemini-api-key
```

### 2) Backend

```
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic python-dotenv passlib[bcrypt] pyjwt google-generativeai
alembic upgrade head
uvicorn backend.app:app --reload
```

API будет доступен на `http://localhost:8000`.

### 3) Frontend

```
cd frontend
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`.

## Кратко про API
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Resumes: `GET /resumes`, `POST /resumes`, `GET /resumes/{id}`, `PATCH /resumes/{id}`, `DELETE /resumes/{id}`
- Improve: `POST /resumes/{id}/improve/preview`, `GET /resumes/{id}/improve/preview`, `POST /resumes/{id}/improve/commit`, `GET /resumes/{id}/history`, `DELETE /resumes/improvements/{improvement_id}`

## Примечания
- URL бэкенда зашит в `frontend/src/api.js` (`http://localhost:8000`).
- Для улучшения резюме нужен `API_KEY` от Gemini.
