from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId
from collections import defaultdict
from openai import OpenAI
import yfinance as yf
from datetime import datetime

load_dotenv()

api_key = os.getenv("API_KEY")

## I need to write a function that reads in  the mongodb database and returns a dictionary including the following keys: 'stocks' and 'shares'
def read_mongo_database(mongo_uri, db_name, collection_name, user_id_str, start):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]
    user_id = ObjectId(user_id_str)
    user = collection.find_one({"_id": user_id})
    
    if user and 'holdings' in user:
        ip_dict = defaultdict(float)
        for holding in user['holdings']:
            ticker = holding['ticker']
            shares = holding['shares']
            etf = getETF(ticker, start)
            ip_dict[ticker] = (etf, shares)
        return ip_dict
    else:
        return None


def getETF(ticker, start):
    client = OpenAI(api_key=api_key)

    prompt = f"Given the stock ticker {ticker}, return only the most related **ETF's** ticker. Do not include any explanations or additional text—**only output the ETF ticker**."

    sys_prompt = "You are a financial data expert specializing in ETFs and stock relationships. Your task is to identify the most related ETF to a given stock ticker based on sector, correlation, or holdings overlap. You must strictly return only the ETF's ticker symbol without any explanations, descriptions, or extra text."

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0
    )
    suggested_etf = response.choices[0].message.content

    etf_data = yf.Ticker(suggested_etf)
    inception_date = etf_data.info.get("fundInceptionDate")
    inception_date = str(datetime.utcfromtimestamp(inception_date))
    
    if inception_date and inception_date < start:
        return suggested_etf
    else:
        return "SPY"


