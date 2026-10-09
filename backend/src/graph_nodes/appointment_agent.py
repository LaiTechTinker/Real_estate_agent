from datetime import datetime
import os
# from dotenv import load_dotenv
# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.prebuilt import tools_condition
from typing import Literal
from src.llm.providers import (create_gemini_llm,create_openai_llm,create_groq_llm)
from src.llm.resilient import make_resilient_llm
from src.util.state import State
from src.util.appointment_tools import safe_tools, sensitive_tools, sensitive_tool_names
from src.util.general_tools import CompleteOrEscalate


# load_dotenv()

# llm = ChatGoogleGenerativeAI(
#     model="gemini-3.5-flash",
#     temperature=0,
#     google_api_key=os.getenv("GEMINI_API_KEY"),
# )
gemini_llm = create_gemini_llm()
openai_llm = create_openai_llm()
groq_llm = create_groq_llm()

appointment_agent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a specialized assistant for managing appointments."
            "You can book, edit, cancel appointments on Google Calendar as requested by the user."
            "When booking an appointment, always ask for and include the email of the person you're making the appointment with."
            "After you have completed the task, send user a confirmation text."
            "Use the provided tools. If none of your tools are appropriate for the user's query,"
            "then CompleteOrEscalate the dialog to the host assistant"
            "Current time is: {time}.",
        ),
        ("placeholder", "{messages}"),
    ]
).partial(time=datetime.now())

appointment_tools = (
    safe_tools
    + sensitive_tools
    + [CompleteOrEscalate]
)
gemini_with_tools = gemini_llm.bind_tools(appointment_tools)
openai_with_tools = openai_llm.bind_tools(appointment_tools)
groq_with_tools = groq_llm.bind_tools(appointment_tools)
resilient_llm = make_resilient_llm(
    gemini_with_tools,
   [openai_with_tools, groq_with_tools]
)
appointment_agent_runnable = (
    appointment_agent_prompt | resilient_llm
)
# appointment_agent_runnable = appointment_agent_prompt | llm.bind_tools(
#     safe_tools + sensitive_tools + [CompleteOrEscalate]
# )



def route_appointment_tools(state: State) -> Literal["__end__", "leave_specialized_agent", "safe_appointment_tools", "sensitive_appointment_tools"]:
    route = tools_condition(state)
    if route == "__end__":
        return "__end__"
    tool_calls = state["messages"][-1].tool_calls
    if tool_calls:
        
        did_cancel = any(tc["name"] == CompleteOrEscalate.__name__ for tc in tool_calls)
        if did_cancel:
            return "leave_specialized_agent"
        
        tool_name = tool_calls[0]["name"]
        if tool_name in sensitive_tool_names:
            return "sensitive_appointment_tools"
        return "safe_appointment_tools"
    raise ValueError("Invalid route")
