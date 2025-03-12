import { Component } from '@angular/core';
import { PokerComponent } from './poker/poker.component'; // <-- Import the PokerComponent
import { debug } from 'console';

@Component({
  selector: 'app-root',
  standalone: true,  // <-- Make sure standalone is true
  imports: [PokerComponent], // <-- Add PokerComponent to the imports array
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'poker-app';  // Set the title for your application
}

console.log("This is a test");
