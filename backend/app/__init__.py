from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .main.routes import router as base_router
from .auth.routes import router as auth_router
from .resumes.routes import router as resumes_router

def create_app():
    app = FastAPI(title="fastapi-resume-app")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(base_router)
    app.include_router(auth_router, prefix="/auth")
    app.include_router(resumes_router, prefix="/resumes")

    return app

app = create_app()
