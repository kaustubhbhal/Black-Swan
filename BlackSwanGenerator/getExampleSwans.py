from flask import Flask, request, jsonify
from collections import defaultdict
from pymongo import MongoClient
from bson import ObjectId
from openai import OpenAI
import json, re, os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("API_KEY")

# MongoDB connection details
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")
USER_ID = os.getenv("USER_ID")

app = Flask(__name__)

@app.route('/post_swans', methods=['POST'])
def post_swans():
    if request.method == 'POST':
        data = request.get_data()
        user_id = data['user_id']
        industry_weights = getWeights(MONGO_URI,DB_NAME,COLLECTION_NAME,user_id)
        
        message = getMessage(industry_weights)
        return jsonify(message), 201


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
    - **Name & Start Date** (YYYY-MM-DD)
    - **Description** (What happened, key triggers, and scale of disruption)
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
    system_prompt = "You are a financial crisis expert. Output ONLY VALID JSON. **Ensure** you include ***ONE OF EACH*** rarity and that the events are **relevant** to the industries provided."

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


weights = getWeights(MONGO_URI, DB_NAME, COLLECTION_NAME, USER_ID)
message = getMessage(weights)

print(message)
