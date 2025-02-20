import { Injectable } from "@angular/core";
import * as signalR from "@microsoft/signalr";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  public messages$ = new BehaviorSubject<any[]>([]);
  public matchedUser$ = new BehaviorSubject<string | null>(null);
  public isConnected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7288/chatHub")
      .withAutomaticReconnect()
      .build();
  }

  async startConnection() {
    // Register event handlers BEFORE starting the connection
    this.hubConnection.on("Matched", (userId: string) => {
      this.matchedUser$.next(userId);
    });
  
    this.hubConnection.on("ReceiveMessage", (senderId: string, content: string, sentAt: string) => {
      this.messages$.next([...this.messages$.value, { senderId, content, sentAt }]);
    });
  
    this.hubConnection.on("PartnerDisconnected", () => {
      this.matchedUser$.next(null);
    });
  
    this.hubConnection.onclose(async () => {
      console.warn("Disconnected from SignalR. Reconnecting...");
      this.isConnected$.next(false);
      setTimeout(() => this.startConnection(), 3000); // Auto-reconnect
    });
  
    // Only try to start if we're in the Disconnected state
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.hubConnection.start();
        console.log("Connected to SignalR");
        this.isConnected$.next(true);
        return true;
      } catch (err) {
        console.error("Error connecting: ", err);
        this.isConnected$.next(false);
        return false;
      }
    }
    return this.hubConnection.state === signalR.HubConnectionState.Connected;
  }

  async connect(userId: string) {
    try {
      // Check the current state and handle appropriately
      if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
        await this.startConnection();
      }
      
      // Only proceed if we're successfully connected
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        await this.hubConnection.invoke("Connect", userId);
        console.log("Successfully connected with userId:", userId);
      } else {
        console.error("Cannot invoke Connect - SignalR connection is not in Connected state");
      }
    } catch (err) {
      console.error("Error invoking 'Connect':", err);
    }
  }
  

  async sendMessage(senderId: string, content: string) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke("SendMessage", senderId, content);
    } else {
      console.error("Cannot send message. SignalR is not connected.");
    }
  }

  async disconnect() {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke("Disconnect");
    }
  }
}
