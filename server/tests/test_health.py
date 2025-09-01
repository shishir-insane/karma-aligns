from app import create_app
def test_health():
    app = create_app()
    client = app.test_client()
    rv = client.get("/api/v1/health")
    assert rv.status_code == 200
    assert rv.get_json().get("ok") is True
