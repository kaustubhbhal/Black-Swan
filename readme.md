**Black Swan Project**
This project consists of two main components: a frontend built with Next.js and a backend built with Flask. Follow the steps below to set up and run the project.

*Prerequisites*
- Node.js
- Python 3.12
- MongoDB

**Setup Instructions**
Frontend

1. Navigate to the black-swan-ui directory:
```
cd black-swan-ui
```
2. Install the necessary npm packages:
```
npm install --legacy-peer-deps
```
3. Create a .env file in the black-swan-ui directory with the following content:
```
MONGODB_URI=<your_mongodb_uri>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
NEXTAUTH_SECRET=<your_nextauth_secret>
NEXTAUTH_URL=<your_nextauth_url>
ALPHA_VANTAGE_API_KEY=<your_alpha_vantage_api_key>
```

4. Start the frontend server:
```
npm run dev
```
or 
```
npm start
```
**Backend**

1. Open another terminal tab and navigate to the BlackSwanGenerator directory:
```
cd BlackSwanGenerator
```

2. Create a Python 3.12 virtual environment:
```
python3 -m venv .venv
source .venv/bin/activate
```

3. Installed the required Python packages:
```
pip install -r requirements.txt
```
4. Create a .env file in the BlackSwanGenerator directory with the following content:

```
API_KEY=<your_openai_api_key>
MONGO_URI=<your_mongo_uri>
DB_NAME=<your_db_name>
COLLECTION_NAME=<your_collection_name>
USER_ID=<your_user_id>
CLAUDE_API_KEY=<your_claude_api_key>
```

5. Run the backend server:
```
python3 app.py
```

**Notes**
Ensure that the MongoDB URI and other environment variables are correctly set in both .env files.
The frontend server will be available at http://localhost:3000 by default.
The backend server will be available at http://127.0.0.1:5000 by default.

Happy Hacking! - Ivanka, Jack, Kaustubh
