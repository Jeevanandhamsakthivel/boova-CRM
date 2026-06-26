"""
Shared extension instances. Initialized in app/__init__.py via init_app pattern
to avoid circular imports.
"""
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient

jwt = JWTManager()
cors = CORS()

# Mongo client/db are set up lazily in db.py and attached to app.extensions
mongo_client: MongoClient = None
db = None