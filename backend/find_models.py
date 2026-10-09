import requests
import asyncio
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
load_dotenv()
# api_key = os.environ.get("GROQ_API_KEY")
# api_key=os.getenv("GEMINI_API_KEY")
api_key = os.getenv("GEMINI_API_KEY")
async def main(): 
 try:
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    llm=ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        temperature=0,
        google_api_key=api_key
    )
    # stream the response
    prompt="explain the meaning of artificial intelligence"
    async for chunk in llm.astream(prompt):
       if isinstance(chunk.content, list) and len(chunk.content) > 0:
        text = chunk.content[0].get("text", "")
        print(text, end="", flush=True)
       elif isinstance(chunk.content, str):
        print(chunk.content, end="", flush=True)
    print("Streaming completed.")

 except Exception as e:
    print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
    
    


# prompt="explain the meaning of artificial intelligence"
# def stream_response():
#     for chunk in llm.stream(prompt):
#         print(chunk.content)


# url = "https://api.groq.com/openai/v1/models"

# headers = {
#     "Authorization": f"Bearer {api_key}",
#     "Content-Type": "application/json"
# }

# response = requests.get(url, headers=headers)

# print(response.json())