from fastapi import FastAPI
from app.auth.auth_router import router as auth_router

app = FastAPI(title="Login API")

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}
