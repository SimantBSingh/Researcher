from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import Config


SQLALCHEMY_DATABASE_URL = Config.DATABASE_URL
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=240,
    pool_size=5,
    max_overflow=5,
    pool_timeout=30
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
# TemporaryBase kept for backwards-compat imports; points to same Base
TemporaryBase = Base


def init_db():
    # Import all models so their tables are registered on Base.metadata
    import models.UserModel
    import models.ProjectModel     
    import models.TemplateModel    
    import models.CollaboratorModel
    import models.TaskModel        
    import models.DeadlineModel    
    import models.NotesModel       
    import models.LinkModel        
    import models.FolderModel
    import models.EmailVerificationModel

    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
