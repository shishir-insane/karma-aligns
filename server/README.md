# Karma Aligns — API-first Flask backend
## Quickstart
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app:create_app
flask run
# or
gunicorn "app:create_app()" -c gunicorn.conf.py

## Test Health
```bash
# health should 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5000/api/v1/health

# hit compute repeatedly; you should eventually see 429 once limits kick in
for i in {1..30}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:5000/api/v1/compute \
    -H 'Content-Type: application/json' \
    -d '{"dob":"1984-09-24","tob":"17:30","tz":"+05:30","lat":26.76,"lon":83.37}'
done

# Ascendant
curl "http://127.0.0.1:5000/api/v1/asc?dob=1984-09-24&tob=17:30&tz=%2B05:30&lat=26.7606&lon=83.3732"

# Planets (lean)
curl "http://127.0.0.1:5000/api/v1/planets?dob=1984-09-24&tob=17:30&tz=%2B05:30&lat=26.7606&lon=83.3732"

# Rashi placements
curl "http://127.0.0.1:5000/api/v1/charts/rashi?dob=1984-09-24&tob=17:30&tz=%2B05:30&lat=26.7606&lon=83.3732"

# Chalit placements
curl "http://127.0.0.1:5000/api/v1/charts/chalit?dob=1984-09-24&tob=17:30&tz=%2B05:30&lat=26.7606&lon=83.3732"

# Compute (now includes chart_id you can reuse on the small endpoints)
curl -s -X POST "http://127.0.0.1:5000/api/v1/compute" \
  -H 'Content-Type: application/json' \
  -d '{"dob":"1984-09-24","tob":"17:30","tz":"+05:30","lat":26.7606,"lon":83.3732}' | jq '.chart_id'

```
