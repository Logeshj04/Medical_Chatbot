from flask import Flask, request, jsonify
from flask_cors import CORS
from openrouter_integration import get_openrouter_response

app = Flask(__name__)

# ✅ Allow CORS only from your frontend domain (update if needed)
CORS(app, resources={r"/api/*": {"origins": "https://medical-chatbot-1-z06n.onrender.com"}})

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        # Handle CORS preflight
        response = app.make_default_options_response()
        response.headers.add("Access-Control-Allow-Origin", "https://medical-chatbot-1-z06n.onrender.com")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    data = request.get_json()
    user_message = data.get('message', '')
    response = get_openrouter_response(user_message)
    return jsonify({'reply': response})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
