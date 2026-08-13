# Translation Feature Documentation

## Overview

The translation feature enables real-time translation of chat messages using IndicTrans2, supporting English and 26+ Indian regional languages. Users can chat in their preferred language while messages are automatically translated.

## Architecture

### Backend Components

1. **Translation Service** (`sudarshan-backend/services/translation_service.py`)
   - Communicates with IndicTrans2 model via HTTP
   - Handles translation requests with caching
   - Health checks for translation service availability

2. **Translation Router** (`sudarshan-backend/routers/translation.py`)
   - `/api/v1/translation/health` - Check service availability
   - `/api/v1/translation/languages` - Get supported languages
   - `/api/v1/translation/translate` - Translate text

3. **Configuration** (`sudarshan-backend/core/config.py`)
   - `TRANSLATION_MODEL_URL` - IndicTrans2 service endpoint (default: http://localhost:8000)

### Frontend Components

1. **Translation Store** (`sudarshan-frontend/src/store/translationStore.js`)
   - Manages translation state and preferences
   - Handles translation caching (max 1000 entries)
   - Persists language preferences to localStorage

2. **UI Components**
   - `TranslationControls.jsx` - Language selector and toggle
   - `TranslatedMessage.jsx` - Displays translated messages with original text toggle
   - `TranslationMessageInput.jsx` - Input field with auto-translation

3. **API Integration** (`sudarshan-frontend/src/services/api.js`)
   - Translation API endpoints wrapper

## Supported Languages

- English (eng_Latn)
- Hindi (hin_Deva)
- Bengali (ben_Beng)
- Gujarati (guj_Gujr)
- Kannada (kan_Knda)
- Malayalam (mal_Mlym)
- Marathi (mar_Deva)
- Tamil (tam_Taml)
- Telugu (tel_Telu)
- Urdu (urd_Arab)
- Punjabi (pan_Guru)
- Odia (ory_Orya)
- Assamese (asm_Beng)
- Sanskrit (san_Deva)
- Nepali (npi_Deva)
- And 12 more regional languages...

## How It Works

### Message Flow

1. **Sending Messages**
   - User types in their selected language
   - If translation is enabled and language ≠ English, message is translated to English
   - English message is sent via Stream Chat
   - Original language and text stored in message metadata

2. **Receiving Messages**
   - Messages arrive in English from Stream Chat
   - If translation is enabled and target language ≠ English, messages are translated
   - Users can toggle between translated and original text

### Translation Caching

- Recently translated texts are cached (up to 1000 entries)
- Cache key format: `{src_lang}:{tgt_lang}:{text}`
- LRU eviction when cache exceeds limit
- Cache persists in memory only (cleared on page refresh)

## Setup Instructions

### Prerequisites

1. **IndicTrans2 Model Service** must be running at `http://localhost:8000` (or configured URL)
   - Start the model service: `cd /path/to/model && uvicorn model:app --host 0.0.0.0 --port 8000`

2. **Backend Configuration**
   - Add to `.env` (optional, defaults to localhost:8000):
     ```
     TRANSLATION_MODEL_URL=http://localhost:8000
     ```

3. **Frontend Dependencies**
   - Ensure `zustand` and `zustand/middleware` are installed

### Installation

1. **Backend**
   ```bash
   cd sudarshan-backend
   # Dependencies should already be installed (httpx included)
   pip install httpx  # if not already installed
   ```

2. **Frontend**
   ```bash
   cd sudarshan-frontend
   npm install  # zustand should already be installed
   ```

### Starting the Services

1. Start IndicTrans2 model service:
   ```bash
   cd /path/to/Shudharshan
   python -m uvicorn model:app --host 0.0.0.0 --port 8000
   ```

2. Start backend:
   ```bash
   cd sudarshan-backend
   uvicorn main:app --reload --port 8001
   ```

3. Start frontend:
   ```bash
   cd sudarshan-frontend
   npm run dev
   ```

## Usage

1. **Enable Translation**
   - Click the translation toggle button in the chat header
   - Button shows "ON" when enabled

2. **Select Language**
   - Click the language dropdown
   - Select your preferred Indian regional language
   - Translation is automatically enabled

3. **Chat**
   - Type messages in your selected language
   - Messages are auto-translated to English before sending
   - Incoming messages are translated to your language
   - Click "Show original" to see untranslated text

## API Endpoints

### GET `/api/v1/translation/health`
Check translation service availability.

**Response:**
```json
{
  "status": "ok",
  "translation_service_available": true
}
```

### GET `/api/v1/translation/languages`
Get list of supported languages.

**Response:**
```json
{
  "languages": [
    {"code": "eng_Latn", "name": "English"},
    {"code": "hin_Deva", "name": "Hindi"},
    ...
  ]
}
```

### POST `/api/v1/translation/translate`
Translate text between languages.

**Request:**
```json
{
  "sentences": ["Hello, how are you?"],
  "src_lang": "eng_Latn",
  "tgt_lang": "hin_Deva",
  "max_length": 256,
  "num_beams": 5
}
```

**Response:**
```json
{
  "src_lang": "eng_Latn",
  "tgt_lang": "hin_Deva",
  "results": [
    {
      "source": "Hello, how are you?",
      "translation": "नमस्ते, आप कैसे हैं?"
    }
  ]
}
```

## Error Handling

- **Service Unavailable**: UI shows "Translation unavailable" if model service is down
- **Translation Failures**: Original text is sent/displayed with error toast
- **Network Errors**: Graceful fallback to original text
- **Timeout**: 30-second timeout for translation requests

## Performance Considerations

- **Caching**: Frequently used translations are cached
- **Batch Translation**: Multiple messages can be translated in one request
- **Async Operations**: All translations are non-blocking
- **Debouncing**: Consider adding debouncing for rapid typing (future enhancement)

## Limitations

- Translation only between English and Indian regional languages
- Same language translation is prevented
- Cache is memory-only (not persisted across sessions)
- Maximum message length: 256 tokens (configurable)
- Translation service must be running separately

## Future Enhancements

- [ ] Persistent translation cache (IndexedDB/localStorage)
- [ ] Automatic language detection
- [ ] Translation confidence scores
- [ ] Batch translation for message history
- [ ] Offline translation fallback
- [ ] Translation quality feedback
- [ ] Message edit with re-translation
- [ ] Language auto-detection from user input

## Troubleshooting

**Translation not working:**
1. Check if IndicTrans2 model service is running: `curl http://localhost:8000/health`
2. Check backend logs for translation service errors
3. Verify `TRANSLATION_MODEL_URL` in backend .env
4. Check browser console for frontend errors

**Slow translations:**
1. Model service may be loading (first request)
2. GPU acceleration not available (CPU inference is slower)
3. Network latency between backend and model service

**Languages not showing:**
1. Model service is down
2. Backend cannot reach model service
3. Check API authentication (JWT token required)

## Technical Details

### Translation Model
- **Model**: IndicTrans2 (Seq2Seq Transformer)
- **Languages**: 26+ Indian languages + English
- **Script Support**: Multiple scripts per language (Devanagari, Bengali, etc.)
- **Framework**: Hugging Face Transformers + PyTorch

### Security
- JWT authentication required for all translation endpoints
- No translation data is stored permanently
- All translations happen server-side
- End-to-end encryption maintained for messages

### Dependencies
- **Backend**: `httpx` for async HTTP requests
- **Frontend**: `zustand` for state management, Stream Chat React SDK
