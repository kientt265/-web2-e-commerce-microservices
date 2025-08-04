from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from langchain.agents import AgentExecutor
import os

class Agent:
    """
    Represents a single agent instance with session state and memory.
    """
    def __init__(self, session_id, agent_executor: AgentExecutor):
        self.session_id = session_id
        self.agent_executor = agent_executor
        self.model = init_chat_model(
            model_name="gemini-2.5-flash",
            api_key=os.getenv("GOOGLE_API_KEY")
        )
        self.memory = MemorySaver()
        self.tools = []


    def _get_input(self, user_input):
        """
        Prepare the input dict for the agent (LangChain expects {'input': ...}).
        """
        return {"input": user_input}

    def process_message(self, user_input):
        input_dict = self._get_input(user_input)
        response = self.agent_executor.invoke(input_dict)
        # self.memory.put("user_input", user_input)
        return response