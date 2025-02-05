import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'pokerTestAng';
  cards: { rank: string, suit: string, selected: boolean }[] = [];
  selectedHandCards: { rank: string, suit: string, selected: boolean }[] = [];
  selectedRiverCards: { rank: string, suit: string, selected: boolean }[] = [];
  handCards: { rank: string, suit: string, selected: boolean }[] = [];
  riverCards: { rank: string, suit: string, selected: boolean }[] = [];

  ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

  ngOnInit() {
    this.generateDeck();
  }

  generateDeck() {
    for (let suit of this.suits) {
      for (let rank of this.ranks) {
        this.cards.push({ rank, suit, selected: false });
      }
    }
  }

  toggleCardSelection(card: { rank: string, suit: string, selected: boolean }) {
    if (card.selected) {
      // console.log("Deselected! " + card.rank + card.suit);
      card.selected = false;
      this.selectedHandCards = this.selectedHandCards.filter(c => c !== card);
      this.selectedRiverCards = this.selectedRiverCards.filter(c => c !== card);
    } else {
      if (this.selectedHandCards.length < 2) {
        card.selected = true;
        this.selectedHandCards.push(card);
      } else if (this.selectedRiverCards.length < 5) {
        card.selected = true;
        this.selectedRiverCards.push(card);
      }
    }


  }

  
}

//test for git purposes 