import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private typingInterval: any;

  constructor(private router: Router) { }

  ngOnInit() {
    this.startTypingAnimation();
  }

  ngOnDestroy() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
  }

  startTypingAnimation() {
    const phrases = [
      'Ask me anything...',
      'Get instant answers 24/7',
      'Smart conversations await',
      'Your AI assistant is ready'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseAfterComplete = 2000;
    const pauseAfterDelete = 500;

    const type = () => {
      const currentPhrase = phrases[phraseIndex];
      const typingElement = document.getElementById('typing');

      if (!typingElement) return;

      if (!isDeleting) {
        // Typing forward
        typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentPhrase.length) {
          // Pause before deleting
          setTimeout(() => {
            isDeleting = true;
          }, pauseAfterComplete);
          return;
        }
      } else {
        // Deleting
        typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          // Pause before typing next phrase
          setTimeout(type, pauseAfterDelete);
          return;
        }
      }

      setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
    };

    // Start the animation
    type();
  }

  handleNavigation() {
    if (localStorage.getItem('userId')) {
      this.router.navigate(['/chat']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
