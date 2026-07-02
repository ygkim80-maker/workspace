from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import FeedComment, FeedPost
from schemas import FeedCommentCreate, FeedCommentOut, FeedPostCreate, FeedPostOut, FeedPostUpdate

router = APIRouter(prefix="/api/v1/feed", tags=["feed"])


def _list_posts(q: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FeedPost)
    if q:
        query = query.filter(FeedPost.title.ilike(f"%{q}%"))
    if category:
        query = query.filter(FeedPost.category == category)
    return query.order_by(FeedPost.id.desc()).all()


router.add_api_route("", _list_posts, methods=["GET"], response_model=List[FeedPostOut])
router.add_api_route("/", _list_posts, methods=["GET"], response_model=List[FeedPostOut], include_in_schema=False)


@router.get("/{post_id}", response_model=FeedPostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    obj = db.get(FeedPost, post_id)
    if not obj:
        raise HTTPException(404, "Not found")
    return obj


def _create_post(item: FeedPostCreate, db: Session = Depends(get_db)):
    obj = FeedPost(**item.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


router.add_api_route("", _create_post, methods=["POST"], response_model=FeedPostOut)
router.add_api_route("/", _create_post, methods=["POST"], response_model=FeedPostOut, include_in_schema=False)


@router.put("/{post_id}", response_model=FeedPostOut)
def update_post(post_id: int, item: FeedPostUpdate, db: Session = Depends(get_db)):
    obj = db.get(FeedPost, post_id)
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in item.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    obj = db.get(FeedPost, post_id)
    if not obj:
        raise HTTPException(404, "Not found")
    db.query(FeedComment).filter(FeedComment.post_id == post_id).delete()
    db.delete(obj)
    db.commit()
    return {"ok": True}


@router.get("/{post_id}/comments", response_model=List[FeedCommentOut])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    return db.query(FeedComment).filter(FeedComment.post_id == post_id).order_by(FeedComment.id.asc()).all()


@router.post("/{post_id}/comments", response_model=FeedCommentOut)
def add_comment(post_id: int, item: FeedCommentCreate, db: Session = Depends(get_db)):
    obj = FeedComment(post_id=post_id, content=item.content, author=item.author or "관리자")
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{post_id}/comments/{comment_id}")
def delete_comment(post_id: int, comment_id: int, db: Session = Depends(get_db)):
    obj = db.get(FeedComment, comment_id)
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
