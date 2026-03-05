from flask import Flask, jsonify
import redis
import json
import asyncio
from scraper import ejecutar_scraping

app = Flask(__name__)

# Intentar conexión a Redis
try:
    r = redis.Redis(host='redis-service', port=6379)
    r.ping()
    print("✅ Conectado a Redis")
    redis_status = "conectado"
except Exception as e:
    print("❌ Error al conectar con Redis:", e)
    r = None
    redis_status = f"error: {e}"

@app.route("/run-scraper", methods=["POST"])
def run_scraper():
    print("🔍 Ejecutando scraper...")
    if not r:
        return jsonify({"error": "Redis no está disponible", "redis_status": redis_status}), 500
    try:
        raw_data = r.get("datos:webscraping")
        if not raw_data:
            return jsonify({"error": "No hay datos en Redis", "redis_status": redis_status}), 404

        # Decodificar manualmente los bytes si es necesario
        if isinstance(raw_data, bytes):
            raw_data = raw_data.decode("utf-8")

        data = json.loads(raw_data)

        # Ejecutar scraping usando asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        resultado = loop.run_until_complete(ejecutar_scraping(data))

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e), "redis_status": redis_status}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

