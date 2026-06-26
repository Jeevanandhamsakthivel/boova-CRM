"""
Application entrypoint. Run with: python run.py
For production, use: gunicorn -w 4 -b 0.0.0.0:5000 run:app
"""
import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)