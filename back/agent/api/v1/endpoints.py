"""Agent API Service

This module defines the FastAPI router and endpoints for the Agent API Service.
"""

from fastapi import APIRouter
from core.agent_manager import agent_manager

router = APIRouter()


@router.get("/ping")
async def ping():
    """Ping endpoint to check if the service is running."""
    return {"message": "pong"}


@router.get("/process/{session_id}")
async def process_message(session_id: str, user_input: str):
    """Process user input and return the response."""
    response = agent_manager.process_message(session_id, user_input)
    return {"response": response}
