from pathlib import Path

from fastapi import APIRouter, Request, HTTPException
from fastapi.templating import Jinja2Templates


router = APIRouter(prefix="/playground")

templates = Jinja2Templates(directory="templates")


@router.get("/{topic}")
def playground(topic: str, request: Request):
    template_path = Path(f"templates/playground/{topic}.html")

    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Playground not found")

    return templates.TemplateResponse(
        request=request, name=f"playground/{topic}.html", context={"topic": topic}
    )
