
from fastapi import APIRouter

router = APIRouter()


@router.get("/test")
def test_endpoint():
    return {"message": "This is from api test endpoint"}


@router.get("/health")
async def health_check():
    return {"status": "OK"}
