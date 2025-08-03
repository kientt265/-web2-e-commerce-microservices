class ToolCallingAgent:
    """
    Handles registration and invocation of external tools.
    """
    def __init__(self):
        self.tools = {}

    def register_tool(self, name, func, description=None):
        self.tools[name] = {
            "func": func,
            "description": description or ""
        }

    def call_tool(self, name, *args, **kwargs):
        if name not in self.tools:
            raise ValueError(f"Tool '{name}' not registered.")
        return self.tools[name]["func"](*args, **kwargs)

tool_calling_agent = ToolCallingAgent()