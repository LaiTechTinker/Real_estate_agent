from datetime import datetime
import os
# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
# from dotenv import load_dotenv
from langgraph.prebuilt import tools_condition
from typing import Literal
from src.llm.providers import (create_gemini_llm,create_openai_llm,create_groq_llm)
from src.llm.resilient import make_resilient_llm
from src.util.state import State
from src.util.prompts import system_prompt, agent_prompt
from src.util.general_tools import ToSearchAgent, ToAppointmentAgent

# load_dotenv()

# llm = ChatGoogleGenerativeAI(
#     model="gemini-3.5-flash",
#     temperature=0,
#     google_api_key=os.getenv("GEMINI_API_KEY"),
# )
# llm= create_gemini_llm()
gemini = create_gemini_llm()
openai = create_openai_llm()
groq = create_groq_llm()
main_agent_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt + agent_prompt),
        ("placeholder", "{messages}"),
    ]
).partial(time=datetime.now())

main_tools = [ToSearchAgent, ToAppointmentAgent]
gemini_with_tools = gemini.bind_tools(main_tools)
openai_with_tools = openai.bind_tools(main_tools)
groq_with_tools = groq.bind_tools(main_tools)
resilient_llm = make_resilient_llm(
    gemini_with_tools,
   [openai_with_tools, groq_with_tools]
)

# main_agent_runnable = main_agent_prompt | llm.bind_tools(main_tools)
main_agent_runnable = main_agent_prompt | resilient_llm


def route_main_agent(state: State) -> Literal[
    "__end__",
    "search_criteria_agent",
    "appointment_agent"
]:
    route = tools_condition(state)
    if route == "__end__":
        return "__end__"
    tool_calls = state["messages"][-1].tool_calls
    if tool_calls:
        if tool_calls[0]["name"] == ToSearchAgent.__name__:
            return "search_criteria_agent"
        if tool_calls[0]["name"] == ToAppointmentAgent.__name__:
            return "appointment_agent"
    raise ValueError("Invalid route")