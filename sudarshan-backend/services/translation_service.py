"""
Translation service layer using IndicTrans2 model.
"""

import logging
import httpx
from typing import List, Dict, Optional
from core.config import settings

logger = logging.getLogger(__name__)

TRANSLATION_MODEL_URL = getattr(settings, "TRANSLATION_MODEL_URL", "http://localhost:8000")

SUPPORTED_LANGUAGES = {
    "eng_Latn": "English",
    "hin_Deva": "Hindi",
    "ben_Beng": "Bengali",
    "guj_Gujr": "Gujarati",
    "kan_Knda": "Kannada",
    "mal_Mlym": "Malayalam",
    "mar_Deva": "Marathi",
    "npi_Deva": "Nepali",
    "ory_Orya": "Odia",
    "pan_Guru": "Punjabi",
    "san_Deva": "Sanskrit",
    "tam_Taml": "Tamil",
    "tel_Telu": "Telugu",
    "urd_Arab": "Urdu",
    "asm_Beng": "Assamese",
    "kas_Arab": "Kashmiri (Arabic)",
    "kas_Deva": "Kashmiri (Devanagari)",
    "kok_Deva": "Konkani",
    "mai_Deva": "Maithili",
    "mni_Beng": "Manipuri (Bengali)",
    "mni_Mtei": "Manipuri (Meitei)",
    "sat_Olck": "Santali",
    "snd_Arab": "Sindhi (Arabic)",
    "snd_Deva": "Sindhi (Devanagari)",
    "brx_Deva": "Bodo",
    "doi_Deva": "Dogri",
}


async def get_supported_languages() -> List[Dict[str, str]]:
    """
    Fetch supported languages from the IndicTrans2 model.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{TRANSLATION_MODEL_URL}/languages")
            response.raise_for_status()
            data = response.json()
            return data.get("languages", [])
    except httpx.RequestError as e:
        logger.error(f"Error fetching languages from translation model: {str(e)}")
        return [{"code": code, "name": name} for code, name in sorted(SUPPORTED_LANGUAGES.items(), key=lambda x: x[1])]
    except Exception as e:
        logger.error(f"Unexpected error fetching languages: {str(e)}")
        return [{"code": code, "name": name} for code, name in sorted(SUPPORTED_LANGUAGES.items(), key=lambda x: x[1])]


async def translate_text(
    sentences: List[str],
    src_lang: str,
    tgt_lang: str,
    max_length: int = 256,
    num_beams: int = 5
) -> List[Dict[str, str]]:
    """
    Translate a list of sentences using the IndicTrans2 model.

    Args:
        sentences: List of sentences to translate
        src_lang: Source language code (e.g., 'eng_Latn')
        tgt_lang: Target language code (e.g., 'hin_Deva')
        max_length: Maximum length for translation generation
        num_beams: Number of beams for beam search

    Returns:
        List of translation pairs with source and translated text

    Raises:
        ValueError: If translation fails or languages are invalid
    """
    if src_lang not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported source language: {src_lang}")
    if tgt_lang not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported target language: {tgt_lang}")
    if src_lang == tgt_lang:
        raise ValueError("Source and target languages must be different")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "sentences": sentences,
                "src_lang": src_lang,
                "tgt_lang": tgt_lang,
                "max_length": max_length,
                "num_beams": num_beams,
            }

            response = await client.post(
                f"{TRANSLATION_MODEL_URL}/translate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    except httpx.TimeoutException:
        logger.error("Translation request timed out")
        raise ValueError("Translation service timed out")
    except httpx.HTTPStatusError as e:
        logger.error(f"Translation service returned error: {e.response.status_code} - {e.response.text}")
        raise ValueError(f"Translation failed: {e.response.text}")
    except httpx.RequestError as e:
        logger.error(f"Error connecting to translation service: {str(e)}")
        raise ValueError(f"Translation service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during translation: {str(e)}")
        raise ValueError(f"Translation failed: {str(e)}")


async def check_translation_service_health() -> bool:
    """
    Check if the translation service is available.

    Returns:
        True if service is healthy, False otherwise
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{TRANSLATION_MODEL_URL}/health")
            response.raise_for_status()
            data = response.json()
            return data.get("status") == "ok" and data.get("model_loaded", False)
    except Exception as e:
        logger.error(f"Translation service health check failed: {str(e)}")
        return False
