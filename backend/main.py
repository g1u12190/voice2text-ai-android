from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv

from google import genai

import os

# ==========================================
# Cargar variables de entorno
# ==========================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise Exception("No existe GEMINI_API_KEY en el archivo .env")

client = genai.Client(api_key=API_KEY)

# ==========================================
# Crear aplicación
# ==========================================

app = FastAPI(
    title="Voice2Text AI",
    version="1.0"
)

# ==========================================
# Permitir peticiones desde Live Server
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://g1u12190.github.io",
        "https://localhost",
        "http://localhost"
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Modelo recibido desde JavaScript
# ==========================================

class TextRequest(BaseModel):
    text: str

# ==========================================
# Ruta de prueba
# ==========================================

@app.get("/")
def root():

    return {
        "status": "ok",
        "message": "Voice2Text AI Backend funcionando"
    }

# ==========================================
# Mejorar texto con Gemini
# ==========================================

@app.post("/improve")
def improve(request: TextRequest):

    prompt = (
        "Corrige la ortografía, gramática y puntuación del siguiente texto. "
        "No cambies el significado. "
        "Devuelve únicamente el texto corregido.\n\n"
        f"{request.text}"
    )

    try:

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        return {
            "improved_text": response.text
        }

    except Exception as e:

        print(e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
