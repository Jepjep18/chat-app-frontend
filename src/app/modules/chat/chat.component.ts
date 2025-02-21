import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
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
  disconnectionMessage: string | null = null; // Track disconnection message


  constructor(private signalRService: SignalRService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currentUser = "user_" + Math.floor(Math.random() * 10000);
    console.log("Generated user ID:", this.currentUser);

    // Retrieve interests from navigation state
    if (history.state.interests) {
      this.interests = history.state.interests;
      console.log("Received interests for matching:", this.interests);
    }

    this.signalRService.disconnectionMessage$.subscribe((message) => {
      this.disconnectionMessage = message; // Store disconnection status
    });
  }

  startNewChat(): void {
    console.log("Starting a new chat... Clearing previous messages first.");
  
    // Clear previous messages and UI state
    this.signalRService.clearChat();
    this.messages = []; // Reset messages array in the component
    this.signalRService.messages$.next([]); // Ensure the BehaviorSubject updates the UI
    this.matchedUser = null; // Reset the matched user
  
    // ✅ Reset disconnection message to hide "Stranger Disconnected"
    this.disconnectionMessage = null;
  
    if (!this.isConnected) {
      console.log("Attempting to start a new chat with interests:", this.interests);
  
      this.signalRService.startConnection().then(() => {
        this.signalRService.connectWithInterests(this.currentUser, this.interests);
        this.isConnected = true;
  
        this.signalRService.matchedUser$.subscribe((user) => {
          this.matchedUser = user;
          console.log("Matched with user:", user);
        });
  
        this.signalRService.messages$.subscribe((messages) => {
          console.log("Messages updated:", messages);
          this.messages = messages;
        });
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

      // Clear matched user's chat history
      if (this.matchedUser) {
        console.log(`Clearing chat for matched user: ${this.matchedUser}`);
        this.signalRService.clearChat();
        this.cdr.detectChanges(); // Force UI update
      }
      

      this.matchedUser = null;
      this.isConnected = false;
      this.messages = [];
    }
  }

  navigateToInterestSection() {
    this.router.navigate(["/chat"]); // Navigate
  }
}