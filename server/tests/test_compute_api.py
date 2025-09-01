# tests/test_compute_api.py
import json
from app import create_app

def test_compute_smoke():
    app = create_app()
    c = app.test_client()
    payload = {"dob":"1984-09-24","tob":"17:30","tz":"+05:30","lat":26.76,"lon":83.37}
    r = c.post("/api/v1/compute", data=json.dumps(payload), content_type="application/json")
    assert r.status_code == 200
    j = r.get_json()
    for k in ("asc","charts","table"): assert k in j
