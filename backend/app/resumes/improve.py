import os
from dotenv import load_dotenv
import google.generativeai as genai


def improve_resume(draft_text: str) -> str:
    load_dotenv()
    api_key = os.getenv("API_KEY")
    if not api_key:
        raise RuntimeError("API_KEY is not set in environment")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("models/gemini-2.5-flash")

    prompt = f"""
Ты — генератор резюме.

СТРОГИЕ ПРАВИЛА ВЫВОДА:
- Выводи ТОЛЬКО текст резюме
- НИКАКИХ комментариев, пояснений или вступлений
- НЕ используй фразы вроде "отлично", "я", "как HR", "комментарий"
- НЕ добавляй объяснения
- НЕ пиши ничего вне структуры резюме
- НЕ используй символы для разметки текста (например "*")
- Пиши кратко и по делу

ЗАДАЧА:
На основе черновика ниже создай профессиональное, структурированное резюме.
Не выдумывай факты. Пиши на русском языке.

СТРОГАЯ СТРУКТУРА:
[Имя Фамилия]
Краткий профиль
Ключевые навыки
Опыт и проекты
Сильные стороны
Дополнительная информация

ЧЕРНОВИК:
\"\"\"
{draft_text}
\"\"\"
"""

    response = model.generate_content(prompt)

    if not response or not response.text:
        raise RuntimeError("Empty response from Gemini")

    return response.text.strip()
