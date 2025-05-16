from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from openrouter_integration import get_openrouter_response

app = Flask(__name__)

# ✅ ALLOW SPECIFIC FRONTEND DOMAIN
CORS(app, origins=["https://medical-chatbot-1-z06n.onrender.com"], supports_credentials=True)

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    # ✅ Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'https://medical-chatbot-1-z06n.onrender.com'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        return response

    data = request.get_json()
    user_message = data.get('message', '')

    try:
        response_text = get_openrouter_response(user_message)
    except Exception as e:
        return jsonify({'reply': f"Error: {str(e)}"}), 500

    # ✅ Add CORS headers manually for POST response
    response = jsonify({'reply': response_text})
    response.headers['Access-Control-Allow-Origin'] = 'https://medical-chatbot-1-z06n.onrender.com'
    return response

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
