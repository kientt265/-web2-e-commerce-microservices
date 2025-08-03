import getpass
import uvicorn
from fastapi import FastAPI, Request
# from langchain.agents import initialize_agent, AgentType
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import Tool
import os

app = FastAPI()

if "GOOGLE_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter your Google AI API key: ")

def hello_tool(name: str) -> str:
    return f"Hello, {name}!"

tools = [
    Tool(
        name="HelloTool",
        func=hello_tool,
        description="Greets the user by name."
    )
]

# Initialize LangChain agent with Google Generative AI
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
)

messages = [
    (
        "system",
        "You are a helpful assistant that translates English to French. Translate the user sentence.",
    ),
    ("human", "I love programming."),
]

ai_msg = llm.invoke(messages)
ai_msg

print(f"AI response: {ai_msg.content}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3002)
