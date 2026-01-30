from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from routers import profile, applications, challenges
import models, schemas, auth
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RuralMinds API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(applications.router)
app.include_router(applications.router)
app.include_router(challenges.router)
from routers import solutions
app.include_router(solutions.router)
from routers import admin
app.include_router(admin.router)
from routers import organization
app.include_router(organization.router)
from routers import learning
app.include_router(learning.router)
from routers import analytics
app.include_router(analytics.router)
from routers import users
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Hello World", "project": "RuralMinds"}

from routers import auth_routes
app.include_router(auth_routes.router)

@app.get("/auth/me", response_model=schemas.UserPublic)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.delete("/auth/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return
