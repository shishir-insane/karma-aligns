from vedic_predictions_engine_refactored import PredictionEngine, GeoPoint
import datetime as dt

eng = PredictionEngine(ayanamsa="lahiri")
natal = eng.compute_natal("1984-09-24","17:30","+05:30",26.7606,83.3732,84)
planets = {k:v["lon"] for k,v in natal["planets"].items()}

vargas = eng.compute_vargas(planets)
aspects = eng.compute_aspects(planets, orb=3.0)
dasha = eng.compute_dasha(planets["MOON"], dt.datetime.fromisoformat(natal["datetime"]), "+05:30")
