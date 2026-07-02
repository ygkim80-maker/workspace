import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Vercel 서버리스 환경에서는 /tmp 에만 쓰기가 가능합니다.
# 로컬에서는 프로젝트 폴더 내 zeniel.db를 사용합니다.
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/zeniel.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "zeniel.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
