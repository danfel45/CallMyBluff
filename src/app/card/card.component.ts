import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() card: string = ''; // The card identifier (e.g., "2H", "KH")
  @Input() selected: boolean = false; // Whether the card is selected

  // This method generates the URL for the card image based on the card identifier.
  getCardImageUrl(): string {
    if (!this.card) return ''; // If no card is provided, return empty
    return `/cards/${this.card.toUpperCase()}.png`;  // Converts to uppercase and fetches the image (e.g., "2H.png")
  }

  // Optionally handle image load errors
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none'; // Hide the image if it fails to load
    console.error(`Failed to load card image: ${this.card.toUpperCase()}.png`);
  }
}
