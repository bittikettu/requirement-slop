from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import requirements, traces, export, projects
from . import database, models

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ReqTool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requirements.router)
app.include_router(traces.router)
app.include_router(export.router)
app.include_router(projects.router) 

@app.get("/")
def read_root():
    return {"message": "ReqTool Backend is Running"}
