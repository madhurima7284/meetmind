from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def setup_module():
    Base.metadata.create_all(bind=engine)

def teardown_module():
    Base.metadata.drop_all(bind=engine)

def test_create_and_get_meeting():
    response = client.post("/api/meetings", json={"title": "Sprint Planning Test"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Sprint Planning Test"
    assert "id" in data

    meeting_id = data["id"]
    get_res = client.get(f"/api/meetings/{meeting_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == meeting_id

def test_list_meetings():
    response = client.get("/api/meetings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_stats():
    response = client.get("/api/meetings/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_meetings" in data
    assert "total_action_items" in data
