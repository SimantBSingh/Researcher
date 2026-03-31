# from .UserModel import User
# from .FileModel import File, FileShare
# from .FolderModel import Folder, FolderShare
# from .OAuthCredentials import OAuthCredentials
# from .ProjectModel import Project, ProjectShare
# from TemplateModel import TemplateModel, TemplateFolder


# __all__ = ["User", "File", "FileShare", "Folder", "FolderShare", "Project", "ProjectShare", "OAuthCredentials", "TemplateModel", "TemplateFolder"]

import pathlib
import importlib

# Get the directory containing this __init__.py file
models_dir = pathlib.Path(__file__).parent

# Initialize an empty list to store model classes
__all__ = []

# Iterate through all .py files in the models directory
for file_path in models_dir.glob("*.py"):
    if file_path.stem != "__init__":  # Skip __init__.py
        # Import the module
        module = importlib.import_module(f".{file_path.stem}", package=__package__)
        
        # Add any classes defined in the module that inherit from Base
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            # Check if it's a class and a SQLAlchemy model
            if isinstance(attr, type) and hasattr(attr, "__tablename__"):
                globals()[attr_name] = attr
                __all__.append(attr_name)
