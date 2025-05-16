from flask import Flask, request, jsonify
from flask_cors import CORS
from openrouter_integration import get_openrouter_response

app = Flask(__name__)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')

    response = get_openrouter_response(user_message)
    return jsonify({'reply': response})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))  # default to 10000 if PORT is not set
    app.run(host="0.0.0.0", port=port, debug=True)
