from fastapi import FastAPI
from .main.routes import router as base_router
from .auth.routes import router as auth_router

def create_app():
    app = FastAPI(title="fastapi-resume-app")
    app.include_router(base_router)
    app.include_router(auth_router, prefix="/auth")

    return app

app = create_app()