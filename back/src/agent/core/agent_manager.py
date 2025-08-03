from agent.agents.conversation_agent import conversation_agent
from agent.agents.tool_calling_agent import tool_calling_agent

class AgentManager:
    """
    Manages the lifecycle and interactions of conversation and tool agents.
    """
    def __init__(self, tools=None):
        self.conversation_agent = conversation_agent
        self.tool_agent = tool_calling_agent
        if tools:
            for tool in tools:
                self.tool_agent.register_tool(
                    name=tool["name"],
                    func=tool["func"],
                    description=tool.get("description", "")
                )

    def run(self, user_input):
        # Get response from conversation agent
        response = self.conversation_agent.respond(user_input)
        # Optionally, parse response for tool calls and invoke tool_agent
        # For now, just return the conversation response
        return response
    

