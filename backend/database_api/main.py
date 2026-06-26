from contextlib import asynccontextmanager
from database_api.routes.auth_routes import router as auth_router
from database_api.routes.screening_routes import router as screening_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from database_api.database.mongodb import client

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await client.admin.command("ping")
        print("✅ MongoDB Atlas Connected Successfully")
    except Exception as e:
        print("❌ MongoDB Connection Failed")
        print(e)

    yield

    client.close()


app = FastAPI(
    title="ResumeIQ Database API",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth_router)
app.include_router(screening_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)