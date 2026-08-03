from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routers.home import router as home_router
from app.routers.playground import router as playground_router

app = FastAPI()


app.mount("/static", StaticFiles(directory="static"), name="static")


app.include_router(home_router)
app.include_router(playground_router)


@app.get("/health")
def health():
    return {"status": "ok"}
