from fastapi import APIRouter, HTTPException
from .auth_schemas import LoginRequest, LoginResponse
from .auth_service import authenticate_user

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    is_valid = authenticate_user(data.email, data.password)

    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas"
        )

    return {"message": "Login exitoso"}
