import { Component, OnInit } from "@angular/core";
import { SignalRService } from "../../services/signalr.service";

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
  isConnected: boolean = false; // Track connection status

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    // Generate a unique user ID but don't connect yet
    this.currentUser = "user_" + Math.floor(Math.random() * 10000);
    console.log("Generated user ID:", this.currentUser);
  }

  startNewChat(): void {
    if (!this.isConnected) {
      console.log("Starting a new chat...");
      this.signalRService.startConnection().then(() => {
        this.signalRService.connect(this.currentUser);
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
}
