from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

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
        # Map Spanish categories to English/DB keys if necessary, or just use Spanish
        # For simplicity in this demo, we'll try to match exact first
        query = query.filter(models.Article.category == category)
    
    results = query.all()
    
    # If no results found (empty DB), return mock data for DEMO purposes
    if not results:
        mock_articles = [
            models.Article(
                id=uuid.uuid4(),
                title="Guía de Entrevistas Inclusivas",
                summary="Aprende a estructurar entrevistas que permitan brillar al talento neurodivergente.",
                content="Contenido completo de la guía de entrevistas...",
                author="Equipo PACTO",
                category="Contratación",
                tags=["entrevistas", "rrhh"],
                created_at=datetime.now()
            ),
            models.Article(
                id=uuid.uuid4(),
                title="Ajustes Razonables: Más allá de la rampa",
                summary="Descubre cómo pequeños cambios en el entorno digital impactan positivamente.",
                content="Contenido sobre ajustes sensoriales y cognitivos...",
                author="Ana Experta",
                category="Adaptaciones",
                tags=["ajustes", "sensorial"],
                created_at=datetime.now()
            ),
             models.Article(
                id=uuid.uuid4(),
                title="Neurodiversidad 101 para Managers",
                summary="Conceptos básicos para liderar equipos neurodiversos con éxito.",
                content="Contenido educativo básico...",
                author="Rural Minds Academy",
                category="Neurodiversidad 101",
                tags=["liderazgo"],
                created_at=datetime.now()
            )
        ]
        # Filter mocks if category is selected
        if category:
            return [a for a in mock_articles if a.category == category]
        return mock_articles
        
    return results

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
