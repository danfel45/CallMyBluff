from flask import Flask, request, jsonify
from treys import Card, Evaluator, Deck
from sklearn.ensemble import RandomForestRegressor
import numpy as np
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

# Function to generate poker hand data
def generate_poker_data(num_samples=10000):
    evaluator = Evaluator()
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
        X.append(hand + community)  # Combine hand and community cards as feature vector
        y.append(score)  # Score is the label (hand strength)
    
    X = np.array(X)
    y = np.array(y)
    
    return X, y

# Train the model (this will run once when the Flask app starts)
X, y = prepare_data(num_samples=10000)
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

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

# Define the API endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data from the request
        data = request.get_json()
        
        # Extract hand and community cards from the request
        hand_input = data.get('hand')
        community_input = data.get('community')
        
        if not hand_input or len(hand_input) != 2 or not community_input or len(community_input) != 5:
            return jsonify({'error': 'Invalid input: You must provide exactly 2 hand cards and 5 community cards.'}), 400
        
        # Convert user input to treys card format
        hand = [Card.new(input_to_card(card)) for card in hand_input]
        community = [Card.new(input_to_card(card)) for card in community_input]
        
        # Prepare the feature vector for prediction
        hand_data = hand + community  # Combine hand and community cards
        
        # Predict hand strength
        prediction = model.predict([hand_data])[0]
        
        # Calculate exact hand strength using treys.Evaluator
        evaluator = Evaluator()
        exact_strength = evaluator.evaluate(community, hand)
      
        # Return the result as JSON
        return jsonify({
            'hand': [Card.int_to_pretty_str(card) for card in hand],
            'community': [Card.int_to_pretty_str(card) for card in community],
            'predicted_hand_strength': float(prediction),
            'exact_hand_strength': int(exact_strength)
            
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
