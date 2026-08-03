from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(
    title="My FastAPI",
    description="My First FastAPI Project",
    version="1.0.0"
)
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="satic")

# @app.get("/")
# def home():
#     return {"message": "Hello FastAPI"}

@app.get("/")
def home(request:Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "username": "Jibum",
            "age": 32,
        }
    )
