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
  prediction: any = null;
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
        exactHandStrength: data.exact_hand_strength ?? 'Not available yet',
        cardsRemaining: data.cards_remaining ?? 5 - this.community.length
      };
      this.updateStrengthBar();

    } catch (error) {
      console.error('Error fetching prediction:', error);
      this.error = 'Error fetching prediction. Please try again.';
      this.prediction = null;
    } finally {
      this.loading = false;
    }
  }

  getStrengthPercentage(): number {
    if (!this.prediction) return 0;
    return this.prediction.exactHandStrength !== 'Not available yet' 
      ? this.prediction.exactHandStrength 
      : this.prediction.predictedHandStrength;
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
    this.prediction = null;
    this.error = null;
  }


  getBestHand(): string {
    const allCards = [...this.hand, ...this.community];
    const handRanks = allCards.map(card => card[0]); // The first character is the rank
    const handSuits = allCards.map(card => card[1]); // The second character is the suit

    // Count how many times each rank appears in the hand
    const rankCounts = handRanks.reduce((acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Check for the different hand types
    const uniqueRanks = Object.values(rankCounts);
    uniqueRanks.sort((a, b) => b - a); // Sort counts from high to low

    if (uniqueRanks[0] === 4) return "Four of a Kind";
    if (uniqueRanks[0] === 3 && uniqueRanks[1] === 2) return "Full House";
    if (uniqueRanks[0] === 3) return "Three of a Kind";
    if (uniqueRanks[0] === 2 && uniqueRanks[1] === 2) return "Two Pair";
    if (uniqueRanks[0] === 2) return "Pair";

    // You can add more checks for straights, flushes, etc. if you wish
    // For now, default to "High Card" if no specific hand is found
    return "High Card";
  }
}