"""
Translation router – /translate endpoints
"""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from core.security import get_current_user_id
from services import translation_service

logger = logging.getLogger(__name__)
router = APIRouter()


class TranslateRequest(BaseModel):
    sentences: List[str] = Field(..., min_length=1, description="List of sentences to translate")
    src_lang: str = Field(..., description="Source language code, e.g. 'eng_Latn'")
    tgt_lang: str = Field(..., description="Target language code, e.g. 'hin_Deva'")
    max_length: int = Field(256, ge=1, le=1024)
    num_beams: int = Field(5, ge=1, le=10)


class TranslationPair(BaseModel):
    source: str
    translation: str


class TranslateResponse(BaseModel):
    src_lang: str
    tgt_lang: str
    results: List[TranslationPair]


class LanguageInfo(BaseModel):
    code: str
    name: str


class LanguagesResponse(BaseModel):
    languages: List[LanguageInfo]


class HealthResponse(BaseModel):
    status: str
    translation_service_available: bool


@router.get(
    "/translation/health",
    summary="Check translation service health",
    response_model=HealthResponse
)
async def health(
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Check if the translation service is available and healthy.
    """
    is_healthy = await translation_service.check_translation_service_health()
    return HealthResponse(
        status="ok",
        translation_service_available=is_healthy
    )


@router.get(
    "/translation/languages",
    summary="Get supported languages",
    response_model=LanguagesResponse
)
async def get_languages(
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Return supported language codes with display names for UI dropdowns.
    """
    languages = await translation_service.get_supported_languages()
    return LanguagesResponse(languages=languages)


@router.post(
    "/translation/translate",
    summary="Translate text between languages",
    response_model=TranslateResponse
)
async def translate(
    req: TranslateRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Translate a list of sentences from source language to target language
    using the IndicTrans2 model.
    """
    try:
        results = await translation_service.translate_text(
            sentences=req.sentences,
            src_lang=req.src_lang,
            tgt_lang=req.tgt_lang,
            max_length=req.max_length,
            num_beams=req.num_beams,
        )

        return TranslateResponse(
            src_lang=req.src_lang,
            tgt_lang=req.tgt_lang,
            results=results,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Translation failed"
        )
