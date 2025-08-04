import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from prompts.conversation_prompts import AGENT_PROMPT

load_dotenv()


class ConversationAgent:
    """
    Manages conversational state, context, and generates responses.
    """

    def __init__(self, memory=None):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        self.memory = memory or []

    def add_to_memory(self, message):
        self.memory.append(message)

    def get_context(self):
        return self.memory[-5:]  # Return last 5 messages for context

    def _get_message(self, input_message):
        messages = [
            (
                "system",
                AGENT_PROMPT,
            ),
            ("human", input_message),
        ]
        return messages

    def respond(self, user_input):
        # Add user input to memory
        self.add_to_memory({"role": "user", "content": user_input})
        # Prepare messages for LLM
        messages = self._get_message(user_input)
        # Call LLM to get response
        response = self.llm.invoke(messages)
        # Add response to memory
        self.add_to_memory({"role": "assistant", "content": response.content})
        return response.content


conversation_agent = ConversationAgent()
