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

if __name__ == '__main__':
    app.run(debug=True)
