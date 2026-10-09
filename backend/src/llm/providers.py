import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
load_dotenv()


def create_gemini_llm() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        temperature=0,
        google_api_key=api_key
    )

def create_openai_llm() -> ChatOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    return ChatOpenAI(
        model="gpt-4.1-mini",
        temperature=0,
        api_key=api_key,
    )

def create_groq_llm() -> ChatGroq:
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    return ChatGroq(
    # model="llama-3.1-8b-instant",
    model="qwen/qwen3.8-27b",
    # model="qwen/qwen3-32b",
    api_key=api_key,
    temperature=0.7,
    max_tokens=None
)
