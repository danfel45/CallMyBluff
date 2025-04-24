from flask import Flask, request, jsonify
from treys import Card, Evaluator, Deck
from sklearn.ensemble import RandomForestRegressor
import numpy as np
import joblib
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

# Initialize evaluator once
evaluator = Evaluator()

# Function to generate poker hand data
def generate_poker_data(num_samples=10000):
    deck = Deck()
    data = []
    
    for _ in range(num_samples):
        deck.shuffle()
        
        # Draw two cards for the hand and five cards for the community
        hand = [deck.draw(1)[0], deck.draw(1)[0]]  # Hand is two cards (integers)
        community = [deck.draw(1)[0] for _ in range(5)]  # Community is five cards (integers)
        
        # Evaluate the hand strength
        my_score = evaluator.evaluate(community, hand)
        
        # Ensure a better distribution of strong hands
        if my_score <= 100:  # Strong hands have lower scores
            for _ in range(10):  # Add more samples of strong hands
                data.append((hand, community, my_score))
        else:
            data.append((hand, community, my_score))
    
    return data

# Function to prepare data for training the model
def prepare_data(num_samples=10000):
    data = generate_poker_data(num_samples)
    X = []
    y = []
    
    # Prepare the feature vector and labels
    for hand, community, score in data:
        # Pad community cards with -1 if less than 5 (to handle flop/turn/river)
        padded_community = community + [-1] * (5 - len(community))
        X.append(hand + padded_community)  # Combine hand and community cards as feature vector
        y.append(score)  # Score is the label (hand strength)
    
    X = np.array(X)
    y = np.array(y)
    
    return X, y

# Try to load existing model, otherwise train a new one
try:
    model = joblib.load('hand_strength_model.pkl')
except:
    print("Training new model...")
    X, y = prepare_data(num_samples=10000)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump(model, 'hand_strength_model.pkl')

# Function to convert user input to card format
def input_to_card(card_input):
    # Map suits to their corresponding letters
    suit_map = {'h': 'h', 'd': 'd', 'c': 'c', 's': 's'}
    
    # Extract rank and suit from input
    rank = card_input[:-1].upper()  # Extract rank (e.g., 'A' from 'Ah')
    suit = card_input[-1].lower()   # Extract suit (e.g., 'h' from 'Ah')
    
    # Validate suit
    if suit not in suit_map:
        raise ValueError(f"Invalid suit: {suit}. Use 'h', 'd', 'c', or 's'.")
    
    # Validate rank
    if rank == '10':
        rank = 'T'  # Treys uses 'T' for 10
    elif rank not in ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']:
        raise ValueError(f"Invalid rank: {rank}. Use 2-10, J, Q, K, or A.")
    
    # Combine rank and suit
    return f"{rank}{suit_map[suit]}"

def normalize_strength(score):
    """Normalize the hand strength score to a percentage (0-100)"""
    return ((7463 - max(0, min(7462, score))) / 7462) * 100

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data from the request
        data = request.get_json()
        
        # Extract hand and community cards from the request
        hand_input = data.get('hand', [])
        community_input = data.get('community', [])
        
        if len(hand_input) != 2:
            return jsonify({'error': 'Invalid input: You must provide exactly 2 hand cards.'}), 400
        
        # Convert user input to treys card format
        hand = [Card.new(input_to_card(card)) for card in hand_input]
        community = [Card.new(input_to_card(card)) for card in community_input]
        
        # Pad community cards with -1 if less than 5
        padded_community = community + [-1] * (5 - len(community))
        
        # Prepare the feature vector for prediction
        feature_vector = hand + padded_community
        
        # Predict hand strength
        prediction = model.predict([feature_vector])[0]
        
        # Calculate exact hand strength if we have at least 2 hand cards and some community cards
        exact_strength = None
        if len(hand) == 2 and len(community) >= 3:  # At least flop
            exact_strength = evaluator.evaluate(community, hand)
        
        # Prepare response
        response = {
            'hand': [Card.int_to_pretty_str(card) for card in hand],
            'community': [Card.int_to_pretty_str(card) for card in community],
            'predicted_hand_strength': round(normalize_strength(prediction), 2),
            'cards_remaining': 5 - len(community)
        }
        
        if exact_strength is not None:
            response['exact_hand_strength'] = round(normalize_strength(exact_strength), 2)
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)