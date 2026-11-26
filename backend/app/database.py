from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Creates a local SQLite database file named pillsync.db inside your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./pillsync.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Helper function to give each API request a clean database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
