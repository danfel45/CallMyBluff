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


    if(this.hand.length == 2 && this.community.length == 5)
    {
      this.getPrediction();
    }
    
  }

  isSelected(card: string): boolean {
    return this.hand.includes(card) || this.community.includes(card);
  }

  getPrediction() {
    const apiUrl = 'http://127.0.0.1:5000/predict';
    const payload = { hand: this.hand, community: this.community };

    if (this.hand.length !== 2 || this.community.length !== 5) {
      console.error("You need exactly 2 hand cards and 5 community cards.");
      this.prediction = 'You need exactly 2 hand cards and 5 community cards.';
      return;
    }

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Prediction Response:', data);
        this.prediction = {
          predictedHandStrength: data.predicted_hand_strength || 'No predicted hand strength',
          exactHandStrength: data.exact_hand_strength || 'No exact hand strength'
        };
      })
      .catch(error => {
        console.error('Error fetching prediction:', error);
        this.prediction = 'Error fetching prediction';
      });
  }
}
