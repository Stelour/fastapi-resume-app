import os
import json
from typing import Any, Dict

from dotenv import load_dotenv
import google.generativeai as genai


REQUIRED_KEYS = (
    "full_name",
    "short_profile",
    "skills",
    "experience",
    "strengths",
    "additional_info",
)


def _normalize_text(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):
        v = "\n".join(str(x) for x in v)
    return str(v).strip()


def _validate_and_normalize_resume_json(data: Any) -> Dict[str, str]:
    if not isinstance(data, dict):
        raise RuntimeError("Gemini returned non-object JSON")

    missing = [k for k in REQUIRED_KEYS if k not in data]
    if missing:
        raise RuntimeError(f"Gemini JSON missing keys: {missing}")

    cleaned = {k: _normalize_text(data.get(k)) for k in REQUIRED_KEYS}

    non_empty = sum(1 for k, v in cleaned.items() if v)
    if non_empty < 2:
        raise RuntimeError("Gemini returned too empty resume JSON")

    return cleaned


def improve_resume(draft: Dict[str, Any]) -> Dict[str, str]:
    load_dotenv()
    api_key = os.getenv("API_KEY")
    if not api_key:
        raise RuntimeError("API_KEY is not set in environment")

    if not isinstance(draft, dict) or not draft:
        raise ValueError("draft must be a non-empty dict")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("models/gemini-2.5-flash")

    draft_json = json.dumps(draft, ensure_ascii=False)

    prompt = f"""
Ты — профессиональный редактор резюме (RU). Твоя задача — улучшить формулировки и структуру БЕЗ выдумывания фактов.

ОГРАНИЧЕНИЯ:
- Не добавляй новые факты/достижения/опыт, которых нет во входе.
- Не меняй смысл: только улучши формулировки, ясность, лаконичность, деловой тон.
- Не добавляй вступлений, комментариев, объяснений, оценок.
- Не используй Markdown, звездочки, заголовки с **, списки с буллетами "•" — допускаются обычные строки и переносы.
- Можно исправлять грамматику, убрать воду, сделать текст более “рынковым”.
- Если поле пустое/нет данных — оставь поле пустым.

ФОРМАТ ВЫВОДА (СТРОГО):
Верни ТОЛЬКО валидный JSON-объект (одна JSON-структура и больше ничего).
Никаких тройных кавычек, никаких ```.

СХЕМА JSON (ключи строго такие):
{{
  "full_name": "строка",
  "short_profile": "строка",
  "skills": "строка",
  "experience": "строка",
  "strengths": "строка",
  "additional_info": "строка"
}}

ТРЕБОВАНИЯ К ПОЛЯМ:
- short_profile: 2–4 коротких предложения: роль/уровень/домен + сильные стороны + цель.
- skills: компактный перечень ключевых навыков/технологий в 1–4 строках.
- experience: по возможности структурируй по проектам/местам работы: что делал + результат (без придуманных цифр).
- strengths: 4–8 пунктов через запятую или по строкам (без воды).
- additional_info: языки, город, ссылки, обучение — только если есть во входе.

ВХОДНОЙ ЧЕРНОВИК JSON:
{draft_json}
""".strip()

    response = model.generate_content(prompt)

    text = (response.text or "").strip() if response else ""
    if not text:
        raise RuntimeError("Empty response from Gemini")

    json_text = text
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            json_text = text[start : end + 1]

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned invalid JSON. Head: {text[:200]}") from e

    return _validate_and_normalize_resume_json(data)
