from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict
from pymongo import MongoClient
from bson import ObjectId
from openai import OpenAI
import json, re, os
from dotenv import load_dotenv
import requests
from mongolib import read_mongo_database
from monte_carlo.monte_carlo_portfolio import PortfolioMonteCarlo

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
# In-memory storage for the fake event (not persistent)
global fake_event_string
global JackStatsClass

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


@app.route('/get_jack', methods=['GET'])
def get_jack():
    response = requests.get("http://127.0.0.1:5000/get_string")
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch string"}), 500

    response_data = response.json()
    if 'selected-card' not in response_data:
        return jsonify({"error": "No string found in response"}), 400

    string_data = response_data['selected-card']
    start, end = get_dates(string_data)

    fake_event = generate_fake_event(string_data)
    global fake_event_string
    fake_event_string = str(fake_event)

    try:
        portfolio_id = portfolio_data["id"]
    except KeyError:
        return jsonify({"error": "No portfolio ID found"}), 404
    
    portfolio_dict = read_mongo_database(MONGO_URI, DB_NAME, COLLECTION_NAME, portfolio_id, start)

    global JackStatsClass
    JackStatsClass = PortfolioMonteCarlo(portfolio_dict, start, end)
    
    answer_dict = {}
    answer_dict['portfolio_stats'] = JackStatsClass.monteCarlo(1000, 252)

    for stock in JackStatsClass.stocks:
        answer_dict[stock.ticker] = {
            "beta": stock.beta, 
            "sig_s": stock.sig_S, 
            "sig_etf": stock.sig_ETF, 
            "sig_idio": stock.sig_idio, 
            "lambda_jump": stock.lambda_jump,
            "start_value": stock.start_value,
            "stock_stats": stock.getStatistics()
        }

    return answer_dict, 200
    
@app.route('/get_fake_event', methods=['GET'])
def get_fake_event():
    """Retrieve the generated fake event string."""
    if fake_event_string is None:
        return jsonify({"error": "No fake event found"}), 404

    return jsonify({"fake_event": fake_event_string}), 200


@app.route('/get_jack_images', methods=['GET'])
def get_jack_images():
    try:
        portfolio_id = portfolio_data["id"]
    except KeyError:
        return jsonify({"error": "No portfolio ID found"}), 404

    # Assuming JackStatsClass has methods to generate images
    monte_image = JackStatsClass.generate_monte()
    returns_annualized_image = JackStatsClass.generate_returns_annualized()
    no_jump_image = JackStatsClass.generate_no_jump()

    if not monte_image or not returns_annualized_image:
        return jsonify({"error": "No images generated"}), 500
    
    # Convert images to a format suitable for JSON response
    image_data = [
        {
            "name": "monte_image",
            "data": monte_image  # Assuming monte_image is base64 encoded or similar
        },
        {
            "name": "returns_annualized_image",
            "data": returns_annualized_image  # Assuming returns_annualized_image is base64 encoded or similar
        },
        {
            "name": "no_jump_image",
            "data": no_jump_image  # Assuming no_jump_image is base64 encoded or similar
        }
    ]

    return jsonify({"images": image_data}), 200
      


def get_dates(string_data):
    client = OpenAI(api_key=api_key)

    sys_prompt = "You are an expert in historical financial analysis and risk modeling. Given the name of a past black swan event, determine the most relevant start date when its effects began to impact financial markets or economic data. The end date should always be exactly two years after the start date. **Format your response strictly as YYYY-MM-DD,YYYY-MM-DD without any explanations or additional text.**"

    prompt = f"Given the past black swan event '{string_data},' provide a date range in the format YYYY-MM-DD,YYYY-MM-DD. The start date should reflect when the event first impacted financial markets, and the end date should be exactly two years later. Output only the date range with no additional text."
    
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        response_format={'type': 'text'},
        messages=[
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': prompt}
        ],
        temperature = 0
    )

    dates = response.choices[0].message.content.split(',')
    return dates[0], dates[1]


def generate_fake_event(string_data):
    client = OpenAI(api_key=api_key)

    prompt = "Given the name of a real black swan event from the past, generate a fictional black swan event that could plausibly occur in the future. The fictional event should be inspired by the themes or consequences of the original but should be unique and not simply a repeat. Provide a 3-4 sentence description of this new event, detailing what happens, its unexpected nature, and its broad impact. Here is the past black swan event: " + string_data
    sys_prompt = "You are an expert in risk analysis and scenario generation. Your task is to create plausible but entirely fictional future black swan events inspired by past real-world black swan events. Given the name of a real historical black swan event, generate a unique future event that shares similar unexpected consequences but occurs under different circumstances. The event should be realistic yet unpredictable, with a clear description of what happens, why it is unforeseen, and its global impact. Avoid direct repetition of historical events and focus on novel disruptions that could emerge in the future."
    
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        response_format={'type': 'text'},
        messages=[
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': prompt}
        ],
        temperature = 0.75
    )

    return response.choices[0].message.content
        
    

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
    
    system_prompt = "You are a financial crisis expert. Ensure that the response follows the format described above, with each event clearly separated. Make sure you have **one event of each rarity** category (very uncommon, uncommon, common)."

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4-turbo",
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
