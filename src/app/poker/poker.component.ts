import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-poker',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './poker.component.html',
  styleUrls: ['./poker.component.css']
})
export class PokerComponent {
  suits = ['h', 'd', 'c', 's'];
  ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  deck: string[] = [];
  hand: string[] = [];
  community: string[] = [];
  prediction: any = {
    predictedHandStrength: 0,
    exactHandStrength: null,
    cardsRemaining: 5,
    recommendedAction: "Select cards to get prediction"
  };
  loading = false;

  strengthBarWidth = 0;

  error: string | null = null;

  constructor() {
    this.generateDeck();
  }

  generateDeck() {
    this.deck = [];
    for (let suit of this.suits) {
      for (let rank of this.ranks) {
        this.deck.push(`${rank}${suit}`);
      }
    }
  }

  selectCard(card: string) {
    if (this.hand.includes(card) || this.community.includes(card)) {
      this.hand = this.hand.filter(c => c !== card);
      this.community = this.community.filter(c => c !== card);
    } else if (this.hand.length < 2) {
      this.hand.push(card);
    } else if (this.community.length < 5) {
      this.community.push(card);
    }

    if (this.hand.length === 2 || (this.hand.length === 2 && this.community.length > 0)) {
      this.getPrediction();
    }
  }

  isSelected(card: string): boolean {
    return this.hand.includes(card) || this.community.includes(card);
  }

  async getPrediction() {
    if (this.hand.length !== 2) return;
  
    this.loading = true;
    this.error = null;
    const apiUrl = 'http://127.0.0.1:5000/predict';
    const payload = { hand: this.hand, community: this.community };
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const data = await response.json();
      this.prediction = {
        predictedHandStrength: data.predicted_hand_strength ?? 0,
        exactHandStrength: data.exact_hand_strength ?? null,
        cardsRemaining: data.cards_remaining ?? 5 - this.community.length
      };
      
      // Add recommendation based on strength and cards remaining
      this.prediction.recommendedAction = this.getRecommendation(
        this.prediction.exactHandStrength ?? this.prediction.predictedHandStrength,
        this.prediction.cardsRemaining
      );
      
      this.updateStrengthBar();
  
    } catch (error) {
      console.error('Error fetching prediction:', error);
      this.error = 'Error fetching prediction. Please try again.';
      this.prediction = null;
    } finally {
      this.loading = false;
    }
  }

  getRecommendation(strengthPercent: number, cardsRemaining: number): string {
    // Preflop / Flop (3+ cards left)
    if (cardsRemaining >= 3) {
      if (strengthPercent >= 92) {
        return "Very strong hand - Raise big or go all-in!";
      } else if (strengthPercent >= 78) {
        return "Strong hand - Raise confidently";
      } else if (strengthPercent >= 60) {
        return "Good potential - Bet cautiously or call";
      } else if (strengthPercent >= 40) {
        return "Moderate hand - Check or call small bets";
      } else {
        return "Weak hand - Fold unless very cheap to call";
      }
    }
    // Turn (2 cards left)
    else if (cardsRemaining == 2) {
      if (strengthPercent >= 90) {
        return "Very strong hand - Bet big for value";
      } else if (strengthPercent >= 75) {
        return "Strong hand - Raise to build the pot";
      } else if (strengthPercent >= 55) {
        return "Decent hand - Bet or call reasonable raises";
      } else if (strengthPercent >= 35) {
        return "Marginal hand - Check or call small bets";
      } else {
        return "Weak hand - Fold unless getting good odds";
      }
    }
    // River (1 card left, board complete)
    else {
      if (strengthPercent >= 85) {
        return "Very strong hand - Bet big for maximum value";
      } else if (strengthPercent >= 70) {
        return "Strong hand - Value bet";
      } else if (strengthPercent >= 50) {
        return "Good hand - Bet for thin value or call";
      } else if (strengthPercent >= 30) {
        return "Bluff catcher - Check/call but fold to big bets";
      } else {
        return "Very weak - Fold unless opponent is bluffing often";
      }
    }
  }

  getStrengthPercentage(): number {
    if (!this.prediction) return 0;
    return this.prediction.exactHandStrength !== null 
      ? this.prediction.exactHandStrength 
      : (this.prediction.predictedHandStrength || 0);
  }

  getStrengthColor(percentage: number): string {
    const hue = (percentage * 1.2).toString(10);
    return `hsl(${hue}, 100%, 50%)`;
  }

  updateStrengthBar() {
    const newStrength = this.getStrengthPercentage();
  
    // Reset to 0 first to trigger transition
    this.strengthBarWidth = 0;
  
    // Wait a tick, then set new width
    setTimeout(() => {
      this.strengthBarWidth = newStrength;
    }, 10);
  }

  resetGame() {
    this.hand = [];
    this.community = [];
    this.prediction = {
      predictedHandStrength: 0,
      exactHandStrength: null,
      cardsRemaining: 5,
      recommendedAction: "Select cards to get prediction"
    };
    this.error = null;
    this.strengthBarWidth = 0;
  }

  getBestHand(): string {
    const allCards = [...this.hand, ...this.community];
  
    if (allCards.length === 0) return "";
  
    // Separate ranks and suits
    const ranks = allCards.map(c => c[0]);
    const suits = allCards.map(c => c[1]);
  
    // Convert rank chars to numbers for easier straight detection
    const rankMap: { [key: string]: number } = {
      '2': 2, '3': 3, '4': 4, '5': 5,
      '6': 6, '7': 7, '8': 8, '9': 9,
      'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
  
    const values = ranks.map(r => rankMap[r]).sort((a, b) => a - b);
  
    // Count by rank
    const rankCounts: { [key: number]: number } = {};
    values.forEach(v => rankCounts[v] = (rankCounts[v] || 0) + 1);
  
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
    // Check for flush
    const suitCounts: { [key: string]: string[] } = {};
    allCards.forEach(card => {
      const [rank, suit] = card;
      if (!suitCounts[suit]) suitCounts[suit] = [];
      suitCounts[suit].push(rank);
    });
  
    const flushSuit = Object.keys(suitCounts).find(suit => suitCounts[suit].length >= 5);
    const flushCards = flushSuit ? suitCounts[flushSuit].map(r => rankMap[r]).sort((a, b) => b - a) : [];
  
    const hasFlush = flushCards.length >= 5;
  
    // Check for straight
    const uniqueValues = [...new Set(values)];
    const hasStraight = (vals: number[]) => {
      for (let i = 0; i <= vals.length - 5; i++) {
        if (vals[i + 4] - vals[i] === 4 && new Set(vals.slice(i, i + 5)).size === 5) return true;
      }
      // special case: A-2-3-4-5
      if (vals.includes(14) && vals.includes(2) && vals.includes(3) && vals.includes(4) && vals.includes(5)) return true;
      return false;
    };
    const isStraight = hasStraight(uniqueValues);
  
    // Check for straight flush
    let isStraightFlush = false;
    let isRoyalFlush = false;
  
    if (hasFlush) {
      const flushUnique = [...new Set(flushCards)].sort((a, b) => a - b);
      isStraightFlush = hasStraight(flushUnique);
      isRoyalFlush = isStraightFlush && flushUnique.includes(10) && flushUnique.includes(14);
    }
  
    // Return best hand based on priority
    if (isRoyalFlush) return "Royal Flush";
    if (isStraightFlush) return "Straight Flush";
    if (counts[0] === 4) return "Four of a Kind";
    if (counts[0] === 3 && counts[1] === 2) return "Full House";
    if (hasFlush) return "Flush";
    if (isStraight) return "Straight";
    if (counts[0] === 3) return "Three of a Kind";
    if (counts[0] === 2 && counts[1] === 2) return "Two Pair";
    if (counts[0] === 2) return "Pair";
    return "High Card";
  }
}