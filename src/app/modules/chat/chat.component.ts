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
  matchedUserInterests: string[] = [];
  messages: any[] = [];
  messageContent: string = "";
  isConnected: boolean = false;
  interests: string[] = [];
  disconnectionMessage: string | null = null;
  isSearching: boolean = false;
  matchMessage: string = ""; // Display message when matched

  constructor(private signalRService: SignalRService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currentUser = "user_" + Math.floor(Math.random() * 10000);
    console.log("Generated user ID:", this.currentUser);

    if (history.state.interests) {
      this.interests = history.state.interests;
      console.log("Received interests for matching:", this.interests);
    }

    this.signalRService.disconnectionMessage$.subscribe((message) => {
      this.disconnectionMessage = message;
    });
  }

  startNewChat(): void {
    console.log("Starting a new chat... Clearing previous messages first.");

    // ✅ Start searching
    this.isSearching = true;
    this.matchMessage = ""; // Reset match message

    this.signalRService.clearChat();
    this.messages = [];
    this.signalRService.messages$.next([]);
    this.matchedUser = null;
    this.matchedUserInterests = [];
    this.disconnectionMessage = null;

    if (!this.isConnected) {
      console.log("Attempting to start a new chat with interests:", this.interests);

      this.signalRService.startConnection().then(() => {
        this.signalRService.connectWithInterests(this.currentUser, this.interests);
        this.isConnected = true;

        // ✅ Subscribe to match updates
        this.signalRService.matchedUser$.subscribe((user) => {
          if (user) {
            this.matchedUser = user;
            this.isSearching = false; // ✅ Stop searching when matched

            this.signalRService.getMatchedUserInterests().then((interests) => {
              this.matchedUserInterests = interests;
              this.updateMatchMessage();
            });

            console.log("Matched with user:", user);
          }
        });

        // ✅ Subscribe to messages
        this.signalRService.messages$.subscribe((messages) => {
          console.log("Messages updated:", messages);
          this.messages = messages;
        });
      });

      // ✅ Auto-stop searching after 5 sec if no match
      setTimeout(() => {
        if (!this.matchedUser) {
          this.isSearching = false;
        }
      }, 5000);
    }
  }

  updateMatchMessage(): void {
    if (this.matchedUser) {
      const commonInterests = this.interests.filter(interest => this.matchedUserInterests.includes(interest));

      if (commonInterests.length > 0) {
        this.matchMessage = `Connected with ${this.matchedUser} (Interest: ${commonInterests.join(", ")})`;
      } else {
        this.matchMessage = `Connected with ${this.matchedUser}`;
      }
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

      if (this.matchedUser) {
        console.log(`Clearing chat for matched user: ${this.matchedUser}`);
        this.signalRService.clearChat();
        this.cdr.detectChanges();
      }

      this.matchedUser = null;
      this.isConnected = false;
      this.messages = [];
      this.matchMessage = "";
    }
  }

  navigateToInterestSection() {
    this.router.navigate(["/chat"]);
  }
}
