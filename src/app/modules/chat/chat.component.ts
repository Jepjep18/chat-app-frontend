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
  isTyping: boolean = false; // ✅ Tracks if matched user is typing
  typingUser: string | null = null; // ✅ Stores the typing user's name
  typingTimeout: any; // Timeout for stopping typing indicator
  

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

    // ✅ Listen for typing events
    this.signalRService.listenForTyping((user: string) => {
      this.typingUser = user;
      this.isTyping = true;
      this.resetTypingIndicator();
    });

    this.signalRService.listenForReadReceipts((messageId) => {
      console.log(`📩 Read receipt received for message ID: ${messageId}`);
  
      this.updateMessageStatus(messageId, "read");
  
      // Verify if the status is updated in the messages array
      const updatedMessage = this.messages.find(msg => msg.id === messageId);
      if (updatedMessage) {
          console.log(`✅ Message ID: ${messageId} status updated to: ${updatedMessage.status}`);
      } else {
          console.warn(`⚠️ Message ID: ${messageId} not found in messages array.`);
      }
  });
  
  }

  startNewChat(): void {
    console.log("Starting a new chat... Clearing previous messages first.");
    this.isSearching = true;
    this.matchMessage = "";

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

        this.signalRService.matchedUser$.subscribe((user) => {
          if (user) {
            this.matchedUser = user;
            this.isSearching = false;
            this.signalRService.getMatchedUserInterests().then((interests) => {
              this.matchedUserInterests = interests;
              this.updateMatchMessage();
            });
            console.log("Matched with user:", user);
          }
        });

        this.signalRService.messages$.subscribe((messages) => {
          console.log("Messages updated:", messages);
          this.messages = messages;
        });
      });

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
      this.matchMessage = commonInterests.length > 0 
        ? `Connected with ${this.matchedUser} (Interest: ${commonInterests.join(", ")})`
        : `Connected with ${this.matchedUser}`;
    }
  }

  sendMessage(): void {
    if (this.messageContent.trim() && this.isConnected) {
      this.signalRService.sendMessage(this.currentUser, this.messageContent);
      this.messageContent = "";
      this.signalRService.stopTyping();
    }
  }
  
  onTyping(): void {
    if (this.matchedUser) {
      this.signalRService.startTyping();
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.signalRService.stopTyping();
      }, 2000);
    }
  }
  

  resetTypingIndicator(): void {
    setTimeout(() => {
      this.isTyping = false;
    }, 3000);
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


  // Call this when a message is viewed
onMessageViewed(messageId: string, senderId: string): void {
  this.signalRService.markMessageAsRead(messageId, senderId);
}

// Update message status locally
updateMessageStatus(messageId: string, status: string) {
  const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex !== -1) {
      this.messages[messageIndex].status = status;
      console.log(`✅ Message ID ${messageId} updated to status: ${status}`);
  } else {
      console.warn(`⚠️ Could not update status. Message ID ${messageId} not found.`);
  }
}

}