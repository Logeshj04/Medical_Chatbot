from flask import Flask, request, jsonify
from flask_cors import CORS
from openrouter_integration import get_openrouter_response

app = Flask(__name__)

# Allow CORS for your frontend origin
CORS(app, resources={r"/*": {"origins": "*"}})  # Use "*" for testing. Use specific domain in production

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        # Handle preflight
        response = app.make_default_options_response()
        headers = response.headers

        headers['Access-Control-Allow-Origin'] = '*'
        headers['Access-Control-Allow-Headers'] = 'Content-Type'
        headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        return response

    data = request.get_json()
    user_message = data.get('message', '')

    try:
        response = get_openrouter_response(user_message)
    except Exception as e:
        return jsonify({'reply': f"Error: {str(e)}"}), 500

    return jsonify({'reply': response})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
