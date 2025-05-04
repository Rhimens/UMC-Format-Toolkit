from flask import Flask, jsonify
import json
import os

app = Flask(__name__)

@app.route('/api/cards')
def get_cards():
    try:
        with open(os.path.join(os.path.dirname(__file__), 'filtered_cards.json'), 'r', encoding='utf-8') as f:
            card_data = json.load(f)
            return jsonify(card_data)
    except FileNotFoundError:
        return jsonify({"error": "filtered_cards.json not found."}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format."}), 500

if __name__ == '__main__':
    app.run(debug=True)
