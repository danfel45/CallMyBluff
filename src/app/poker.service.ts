import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PokerService {
  private apiUrl = 'http://127.0.0.1:5000/predict'; // Replace with your backend URL

  constructor(private http: HttpClient) {}

  // Method to predict hand strength by passing hand and community cards
  predictHandStrength(hand: string[], community: string[]): Observable<any> {
    return this.http.post<any>(this.apiUrl, { hand, community });
  }
}
