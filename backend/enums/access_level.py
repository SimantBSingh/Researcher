import enum

class AccessLevel(enum.Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    NONE = "none"


