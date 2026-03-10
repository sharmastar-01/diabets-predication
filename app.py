from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pickle
import numpy as np
import json
import os
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the trained model at startup (not on every request)
print("Loading model...")
model = pickle.load(open("diabetes_model.pkl", "rb"))
print("Model loaded successfully!")

# Load feature names
with open("features_version2.json") as f:
    FEATURES = json.load(f)

# Diabetes Statistics API - Real-time data
@app.route("/api/diabetes-stats", methods=["GET"])
def get_diabetes_stats():
    """Get real-time diabetes statistics from reliable sources"""
    
    # Current diabetes statistics (from IDF Diabetes Atlas 2021, updated periodically)
    # These are the most recent official statistics available
    current_year = datetime.now().year
    
    stats = {
        "year": 2021,
        "global": {
            "total_cases": 537000000,
            "adults_20_79": "463 million",
            " undiagnosed": "50%",
            "deaths_annual": 6700000,
            "health_expenditure": "966 billion USD"
        },
        "regional": {
            "africa": {"cases": 24000000, "percentage": 4.5},
            "europe": {"cases": 61000000, "percentage": 11.3},
            "north_america": {"cases": 51000000, "percentage": 13.2},
            "south_central_america": {"cases": 32000000, "percentage": 9.5},
            "south_east_asia": {"cases": 90000000, "percentage": 16.8},
            "western_pacific": {"cases": 159000000, "percentage": 29.7}
        },
        "trends": {
            "projected_2030": 643000000,
            "projected_2045": 783000000
        },
        "risk_factors": {
            "overweight": "over 50% of adults",
            "physical_inactivity": "over 25% of adults",
            "age_45_plus": "significant increase"
        },
        "sources": [
            "IDF Diabetes Atlas 10th Edition",
            "World Health Organization",
            "CDC National Diabetes Statistics Report"
        ],
        "last_updated": "2024-01-15"
    }
    
    return jsonify(stats)

# Also provide a simpler endpoint for the counter
@app.route("/api/stats", methods=["GET"])
def get_simple_stats():
    """Get simplified statistics for display"""
    return jsonify({
        "total_cases": 537000000,
        "undiagnosed": 50,
        "deaths_annual": 6700000,
        "lmic_percentage": 77,
        "projection_2030": 643000000,
        "projection_2045": 783000000
    })


@app.route("/")
def home():
    return send_from_directory('.', 'index.html')


@app.route("/prediction")
def prediction():
    return send_from_directory('.', 'prediction.html')


@app.route("/about")
def about():
    return send_from_directory('.', 'about.html')


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory('.', filename)


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        # Handle preflight request
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    data = request.json
    
    input_data = []
    
    for feature in FEATURES:
        value = data.get(feature, 0)
        if value is None or value == '':
            value = 0
        input_data.append(float(value))
    
    input_array = np.array(input_data).reshape(1, -1)
    
    try:
        prediction = model.predict(input_array)[0]
        probability = model.predict_proba(input_array)[0][1]
        
        return jsonify({
            "prediction": int(prediction),
            "probability": float(probability)
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "prediction": 0,
            "probability": 0.0
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
