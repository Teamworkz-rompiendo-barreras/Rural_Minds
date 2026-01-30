from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/learning",
    tags=["learning"],
)

@router.get("/", response_model=List[schemas.Article])
def read_articles(
    category: Optional[str] = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Article)
    if category:
        query = query.filter(models.Article.category == category)
    return query.all()

import uuid

@router.get("/{article_id}", response_model=schemas.Article)
def read_article(
    article_id: uuid.UUID, 
    db: Session = Depends(database.get_db)
):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.post("/", response_model=schemas.Article)
def create_article(
    article: schemas.ArticleCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # In a real app, restrict to Admin/Content Creator
    # if current_user.role != 'super_admin': ...
    
    db_article = models.Article(**article.model_dump())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article
