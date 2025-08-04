from fastapi import APIRouter
from core.agent_manager import agent_manager

router = APIRouter()


@router.get("/ping")
async def ping():
    return {"message": "pong"}


@router.get("/process/{session_id}")
async def process_message(session_id: str, user_input: str):
    response = agent_manager.process_message(session_id, user_input)
    return {"response": response}
