import { Component, OnInit } from "@angular/core";
import { SignalRService } from "../../services/signalr.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit {
  currentUser: string = "";
  matchedUser: string | null = null;
  messages: any[] = [];
  messageContent: string = "";
  users: any;
  isConnected: boolean = false;
  interests: string[] = []; // Store interests for matching

  constructor(private signalRService: SignalRService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = "user_" + Math.floor(Math.random() * 10000);
    console.log("Generated user ID:", this.currentUser);

    // Retrieve interests from navigation state
    if (history.state.interests) {
      this.interests = history.state.interests;
      console.log("Received interests for matching:", this.interests);
    }
  }

  startNewChat(): void {
    if (!this.isConnected) {
      console.log("Starting a new chat with interests:", this.interests);
      this.signalRService.startConnection().then(() => {
        this.signalRService.connectWithInterests(this.currentUser, this.interests);
        this.isConnected = true;

        this.signalRService.matchedUser$.subscribe((user) => {
          this.matchedUser = user;
          console.log("Matched with user:", user);
        });

        this.signalRService.messages$.subscribe((messages) => (this.messages = messages));
      });
    }
  }

  sendMessage(): void {
    if (this.messageContent.trim() && this.isConnected) {
      this.signalRService.sendMessage(this.currentUser, this.messageContent);
      this.messageContent = "";
    }
  }

  disconnect(): void {
    if (this.isConnected) {
      console.log("Disconnecting...");
      this.signalRService.disconnect();
      this.matchedUser = null;
      this.isConnected = false;
      this.messages = [];
    }
  }


  navigateToInterestSection() {
    this.router.navigate(['/chat']);
  }
}
