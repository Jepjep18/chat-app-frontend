import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-interest-section',
  templateUrl: './interest-section.component.html',
  styleUrls: ['./interest-section.component.scss']
})
export class InterestSectionComponent implements OnInit {
  interests: string[] = [];
  inputInterest: string = '';

  @Output() interestsSubmitted = new EventEmitter<string[]>();

  constructor(private router: Router) { }

  ngOnInit(): void { }

  addInterest() {
    const trimmedInterest = this.inputInterest.trim();
    if (trimmedInterest && !this.interests.includes(trimmedInterest)) {
      this.interests.push(trimmedInterest);
      this.inputInterest = ''; // Clear input after adding
    }
  }

  removeInterest(index: number) {
    this.interests.splice(index, 1);
  }

  submitInterests() {
    console.log('Submit button clicked');  
    console.log('Current interests:', this.interests);

    if (this.interests.length > 0) {
        console.log('Navigating to /chat with interests...', this.interests);

        this.interestsSubmitted.emit(this.interests);
        this.router.navigate(['/chat/chat'], { state: { interests: this.interests } })
            .then(success => {
                if (success) {
                    console.log('Navigation to /chat successful');
                } else {
                    console.log('Navigation to /chat failed');
                }
            })
            .catch(error => {
                console.error('Error navigating to /chat:', error);
            });
    } else {
        console.warn('No interests entered. Navigation not triggered.');
    }
}


}
