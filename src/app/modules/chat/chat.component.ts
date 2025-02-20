import { Component, OnInit } from "@angular/core";
import { SignalRService } from "../../services/signalr.service";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit {
  currentUser: string = "user1"; // Change dynamically
  currentUsers: string = "user2"; // Change dynamically
  matchedUser: string | "user2" = null;
  messages: any[] = [];
  messageContent: string = "";
users: any;

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    // Generate a random user ID instead of hardcoding "user1"
    this.currentUser = "user_" + Math.floor(Math.random() * 10000);
    console.log("Generated user ID:", this.currentUser);
    
    this.signalRService.startConnection().then(() => {
      this.signalRService.connect(this.currentUser);
    });
  
    this.signalRService.matchedUser$.subscribe((user) => {
      this.matchedUser = user;
      console.log("Matched with user:", user);
    });
    this.signalRService.messages$.subscribe((messages) => (this.messages = messages));
  }

  sendMessage(): void {
    if (this.messageContent.trim()) {
      this.signalRService.sendMessage(this.currentUser, this.messageContent);
      this.messageContent = "";
    }
  }

  disconnect(): void {
    this.signalRService.disconnect();
    this.matchedUser = null;
  }
}
