from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import os

import auth
from routers import (
    users, profile, challenges,
    applications, analytics, messages, legal
)
import models, schemas
from database import engine, get_db

# Create tables only if strictly necessary (better to use migrations)
if os.getenv("VERCEL") != "1":
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Could not connect to DB to create tables: {e}")

app = FastAPI(title="RuralMinds API")

# Configure CORS
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://rural-minds.vercel.app",
]
# Add any additional origins from environment variable
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    allowed_origins.extend(extra_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(applications.router)
# app.include_router(applications.router) # Duplicate removed
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
from routers import onboarding
app.include_router(onboarding.router)
from routers import reports

app.include_router(reports.router)
from routers import debug
app.include_router(debug.router)
app.include_router(messages.router)
app.include_router(legal.router)

@app.get("/status")
def health_check():
    return {"status": "ok", "environment": "production" if os.getenv("VERCEL") else "development"}
    
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
