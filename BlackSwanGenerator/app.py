from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict
from pymongo import MongoClient
from bson import ObjectId
from openai import OpenAI
import json, re, os
from dotenv import load_dotenv
import requests
import anthropic

load_dotenv()
api_key = os.getenv("API_KEY")
claude_api_key = os.getenv("CLAUDE_API_KEY")

# MongoDB connection details
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")
USER_ID = os.getenv("USER_ID")

app = Flask(__name__)
CORS(app)

# In-memory storage for portfolio ID (not persistent)
portfolio_data = {}

@app.route('/add_portfolio', methods=['POST'])
def add_portfolio():
    data = request.get_json()
    portfolio_id = data.get("id")

    if not portfolio_id:
        return jsonify({"error": "Missing portfolio ID"}), 400

    portfolio_data["id"] = portfolio_id  # Store in memory

    return jsonify({"message": "Portfolio ID stored", "id": portfolio_id}), 201

@app.route('/clear_portfolio', methods=['DELETE'])
def clear_portfolio():
    """Clears the stored portfolio ID."""
    portfolio_data.clear()
    return jsonify({"message": "Portfolio ID cleared"}), 200

@app.route('/get_portfolio', methods=['GET'])
def get_portfolio():
    """Retrieves the stored portfolio ID."""
    if "id" not in portfolio_data:
        return jsonify({"error": "No portfolio ID found"}), 404

    return jsonify({"portfolio_id": portfolio_data["id"]}), 200

@app.route('/post_swans', methods=['GET'])  # Change to GET
def post_swans():
    # Call the /get_portfolio route
    response = requests.get("http://127.0.0.1:5000/get_portfolio")

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch portfolio"}), 500
    
    portfolio_data = response.json()

    # Extract user_id from the response
    user_id = portfolio_data.get('portfolio_id')
    if not user_id:
        return jsonify({"error": "user_id not found in portfolio data"}), 400

    # Fetch industry weights using the extracted user_id
    industry_weights = getWeights(MONGO_URI, DB_NAME, COLLECTION_NAME, user_id)

    # Generate message
    message = getMessage(industry_weights)

    return jsonify(message), 200  # Change status code to 200 for GET requests

@app.route('/get_clean_swans', methods=['GET'])
def get_clean_swans():
    # Call the /post_swans route to get the raw response
    response = requests.get("http://127.0.0.1:5000/post_swans")
    
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch portfolio"}), 500

    # Get the raw data from the response
    raw_data = response.json()

    if 'error' in raw_data:
        return jsonify({"error": raw_data['error']}), 400

    # Clean up the raw string by sending it to Claude for processing
    cleaned_data = clean_up_with_claude(raw_data['message'])

    return jsonify(cleaned_data), 200

@app.route('/post_string', methods=['POST'])
def post_string():
    global stored_string  # Ensure we modify the global variable
    
    data = request.get_json()  # Get the incoming JSON data

    # Ensure the data contains a 'string' key
    if 'string' not in data:
        return jsonify({"error": "Missing 'string' in request data"}), 400

    user_string = data['string']
    
    # Store the string
    stored_string = user_string

    return jsonify({"message": "String received", "string": user_string}), 200

@app.route('/get_string', methods=['GET'])
def get_string():
    """Retrieve the stored string."""
    if stored_string is None:
        return jsonify({"error": "No string found"}), 404

    return jsonify({"selected-card": stored_string}), 200


def getWeights(mongo_uri, db_name, collection_name, user_id_str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]
    user_id = ObjectId(user_id_str)
    user = collection.find_one({"_id": user_id})

    if user and 'holdings' in user:
        ip_dict = defaultdict(float)
        for holding in user['holdings']:
            industry = holding['industry']
            percent = holding['percentOfPortfolio']
            ip_dict[industry] += float(percent)

        return ip_dict
    else:
        return None
    
def getMessage(user_industries):
    prompt = "Generate 3 historical categorized Black Swan events that occurred between 1975 and the present, which would have impacted the following portfolio of (industry, weight) pairs:" + str(user_industries) + """
    ### Categorization of Events by Rarity:
    1. **Very Uncommon**: Extremely rare (once in 25+ years), highly unpredictable, such as major financial collapses or unprecedented geopolitical conflicts.
    2. **Uncommon**: Rare (once in 15-25 years), but with historical precedent, such as major recessions or global financial crises.
    3. **Common**: Recurring (every 1-15 years), systemic risks with predictable cycles, such as interest rate hikes, tariffs, or regional market shocks.

    ### For Each Event, Provide:
    - **Name** (e.g., "Global Financial Crisis")
    - **Start Date** (e.g., "2008-09-15")
    - **Description** (A concise description with key triggers and scale of disruption)
    - **Rarity** (very_uncommon, uncommon, common)

    Format your response as a JSON object:
    {
        "events": [
            {
                "name": "Event Name",
                "start_date": "YYYY-MM",
                "description": "Brief explanation of what happened and market impact",
                "rarity": "very_uncommon/uncommon/common"
            },
            ...
        ]
    }

    """
    
    system_prompt = "You are a financial crisis expert. Ensure that the response follows the format described above, with each event clearly separated."

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        response_format={'type': 'json_object'},
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': prompt}
        ],
        temperature = 0.3
    )
    
    try:
        ugly = response.choices[0].message.content
        pretty = re.sub(r'(\w+):', r'"\1":', ugly)
        return json.loads(pretty)
    
    except (json.JSONDecodeError, AttributeError):
        raise ValueError("Invalid JSON response received from OpenAI")



if __name__ == '__main__':
    app.run(debug=True)
