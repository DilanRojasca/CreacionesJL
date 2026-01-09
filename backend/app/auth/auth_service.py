def authenticate_user(email: str, password: str) -> bool:
    """
    Simulación de autenticación.
    En el futuro aquí irá la base de datos.
    """

    fake_user = {
        "email": "admin@test.com",
        "password": "123456"
    }

    return email == fake_user["email"] and password == fake_user["password"]
