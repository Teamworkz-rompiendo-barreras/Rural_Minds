
# Add to backend/routers/users.py

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete the current user's account and all associated data.
    """
    # 1. Delete associated data (cascading usually handles this if configured, but good to be explicit for some)
    # Profile
    if current_user.talent_profile:
        db.delete(current_user.talent_profile)
    
    # Accessibility Profile
    acc_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
    if acc_profile:
        db.delete(acc_profile)
        
    # Applications? Challenges?
    # If Enterprise, maybe prevent delete if active challenges? For now, allow kill.
    
    # 2. Delete User
    db.delete(current_user)
    db.commit()
    
    return None
