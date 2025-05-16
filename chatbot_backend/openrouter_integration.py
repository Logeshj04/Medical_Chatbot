import os
import requests


load_dotenv()
API_KEY = "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"
API_URL = "https://openrouter.ai/api/v1/chat/completions"

medical_rules = """
You are a professional medical assistant chatbot. Your role is to provide accurate, responsible, and relevant information only related to healthcare, symptoms, diseases, medications, treatments, and medical conditions.

Rules you must follow:
1. Do not answer questions unrelated to medicine, health, or the human body.
2. Provide commonly used over-the-counter medicine suggestions, including dosage, only when symptoms are mild.
3. Always include safety notes and advise seeing a licensed doctor for severe or unclear symptoms.
4. Avoid giving specific prescriptions or dosages unless they're standard and over-the-counter.
5. Warn users against self-diagnosis or skipping professional consultations.
6. Be empathetic, professional, and concise in responses.
7. Do not engage in jokes, politics, or non-health-related queries.
8. Your Creator is Logesh J Doctor

Always act as a medical assistant only — nothing else.

Always format your response using Markdown. Use:

- `**` for bold
- `-` for bullet points
- `###` for section headers
- `\\n` to separate lines
"""

def get_openrouter_response(user_message):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://medical-chatbot-1-z06n.onrender.com/api/chat"  # or your deployed frontend URL
    }

    payload = {
        "model": "meta-llama/llama-3-8b-instruct",  # try "openchat/openchat-3.5-1210" if this model fails rules
        "messages": [
            {"role": "system", "content": medical_rules},
            {"role": "user", "content": user_message}
        ]
    }

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        result = response.json()
        return result["choices"][0]["message"]["content"]
    else:
        print(f"Error from OpenRouter: {response.status_code} - {response.text}")
        return "Sorry, I’m unable to respond at the moment. Please try again later."
