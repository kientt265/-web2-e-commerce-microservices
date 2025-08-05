from langchain.tools import Tool


class ToolCallingAgent:
    """
    Handles registration and invocation of external tools.
    """

    def __init__(self):
        self.tools = {}

    def register_tool(self, name, func, description=None):
        self.tools[name] = Tool(name=name, func=func, description=description or "")

    def call_tool(self, name, *args, **kwargs):
        if name not in self.tools:
            raise ValueError(f"Tool '{name}' not registered.")
        return self.tools[name].run(*args, **kwargs)


tool_calling_agent = ToolCallingAgent()


# Sample tool: echo
def echo_tool(message: str) -> str:
    """Returns the input message."""
    return message


tool_calling_agent.register_tool(
    name="echo",
    func=echo_tool,
    description="Returns the input message. Useful for testing.",
)
