import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("HUGGINGFACE_API_KEY")

def recommend_lessons(progress, available_lessons):
    if not available_lessons.exists():
        return []

    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    lesson_titles = [lesson.title for lesson in available_lessons]

    data = {
        "inputs": "Which lesson should I learn next?",
        "parameters": {"candidate_labels": lesson_titles}
    }

    response = requests.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        headers=headers,
        json=data
    )

    if response.status_code != 200:
        return []

    result = response.json()

    if "labels" not in result or "scores" not in result:
        return []

    score_dict = {label: score for label, score in zip(result["labels"], result["scores"])}

    sorted_lessons = sorted(
        available_lessons,
        key=lambda lesson: score_dict.get(lesson.title, 0),
        reverse=True
    )

    return sorted_lessons[:3]
