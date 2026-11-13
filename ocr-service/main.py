import os
import json
import base64
from io import BytesIO
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from groq import Groq
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import pytesseract

load_dotenv()

# On Windows, set TESSERACT_CMD in ocr-service/.env if installed elsewhere.
# In Docker/Linux, pytesseract uses the tesseract executable on PATH.
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
elif os.name == "nt":
    default_tesseract = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(default_tesseract):
        pytesseract.pytesseract.tesseract_cmd = default_tesseract

app = FastAPI(title="PillSync OCR Service", version="1.1.0")
api_key = os.getenv("GROQ_API_KEY", "").strip()
client = Groq(api_key=api_key) if api_key else None
MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "groq_configured": client is not None,
        "vision_model": MODEL if client else None,
        "tesseract_configured": True,
    }


def preprocess_for_ocr(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    gray = ImageEnhance.Contrast(gray).enhance(1.8)
    gray = gray.resize(
        (gray.width * 2, gray.height * 2),
        Image.Resampling.LANCZOS,
    )
    return gray.filter(ImageFilter.MedianFilter(size=3))


def extract_with_groq(image: Image.Image) -> Optional[dict]:
    if not client:
        return None

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

    response = client.chat.completions.create(
        model=MODEL,
        temperature=0,
        max_completion_tokens=900,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract visible information from medicine packaging or "
                    "prescriptions. Do not diagnose, recommend, or infer instructions. "
                    "Never invent missing information. Return JSON with exactly these "
                    "keys: medicineName (string or null), dosage (string or null), "
                    "activeIngredient (string or null), packQuantity (number or null), "
                    "frequency (string or null), instructions (string or null), "
                    "extractedText (string). Frequency and instructions must be null "
                    "unless explicitly readable on the supplied image. packQuantity "
                    "means the number of units in the pack, not daily dose. If uncertain, "
                    "use null. Preserve the original language where appropriate."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Read this medicine image. Extract only clearly visible "
                            "details. Return a JSON object."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{encoded}"},
                    },
                ],
            },
        ],
    )
    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)
    expected = {
        "medicineName": None,
        "dosage": None,
        "activeIngredient": None,
        "packQuantity": None,
        "frequency": None,
        "instructions": None,
        "extractedText": "",
    }
    expected.update({k: parsed.get(k) for k in expected if k in parsed})
    return expected


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded image is empty")
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")

    try:
        image = Image.open(BytesIO(raw))
        image = ImageOps.exif_transpose(image).convert("RGB")
        if image.width * image.height > 20_000_000:
            raise HTTPException(status_code=413, detail="Image dimensions are too large")

        tesseract_text = ""
        tesseract_error = None
        try:
            processed = preprocess_for_ocr(image)
            languages = os.getenv("TESSERACT_LANG", "eng+deu")
            tesseract_text = pytesseract.image_to_string(
                processed,
                lang=languages,
                config="--oem 3 --psm 11",
            ).strip()
        except pytesseract.TesseractNotFoundError:
            tesseract_error = "Tesseract executable not found; Groq vision can still be used."
        except pytesseract.TesseractError as exc:
            tesseract_error = f"Tesseract failed: {exc}"

        groq_details = None
        groq_error = None
        if client:
            try:
                groq_details = extract_with_groq(image)
            except Exception as exc:
                # Preserve local OCR output if the external AI service is unavailable.
                groq_error = f"Groq extraction unavailable: {type(exc).__name__}"

        text = tesseract_text
        if groq_details and groq_details.get("extractedText"):
            text = groq_details["extractedText"]

        lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 1]
        return {
            "text": text,
            "possibleMedicineNames": lines[:15],
            "medicineDetails": groq_details,
            "source": "groq+ tesseract" if groq_details else "tesseract",
            "groqError": groq_error,
            "tesseractError": tesseract_error,
            "notice": (
                "AI/OCR output can be wrong. Verify medicine name, strength, "
                "quantity and prescription instructions against the original "
                "packaging or prescription before saving."
            ),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}")
