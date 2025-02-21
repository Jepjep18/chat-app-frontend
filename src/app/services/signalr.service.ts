import { Injectable } from "@angular/core";
import * as signalR from "@microsoft/signalr";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  public messages$ = new BehaviorSubject<any[]>([]);
  public matchedUser$ = new BehaviorSubject<string | null>(null);
  public isConnected$ = new BehaviorSubject<boolean>(false);
  chatMessages: string[] = []; // Array to store chat messages
  newMessage = new Subject<string>(); // Observable to track new messages
  public disconnectionMessage$ = new BehaviorSubject<string | null>(null);
  public currentUser: string = "";  // Track the current user
  public isTyping: boolean = false; // Track if user is typing

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
  
    this.hubConnection.on("ReceiveMessage", (senderId: string, content: string, sentAt?: string) => {
      if (!senderId || !content) {
        console.warn("Received an incomplete message:", { senderId, content, sentAt });
        return;
      }
    
      const newMessage = { 
        senderId, 
        content, 
        sentAt: sentAt || new Date().toISOString(),  // Default to current timestamp
        status: "sent" 
      };
    
      this.messages$.next([...this.messages$.value, newMessage]);
    });
    
  
    this.hubConnection.on("PartnerDisconnected", () => {
      this.matchedUser$.next(null);
      this.disconnectionMessage$.next("Stranger disconnected"); // Update message
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
      if (!userId) {
        console.error("User ID is missing! Cannot connect.");
        return;
      }
  
      this.currentUser = userId;  // ✅ Ensure user ID is assigned
      console.log(`User connected with ID: ${this.currentUser}`);
  
      if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
        await this.startConnection();
      }
  
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        await this.hubConnection.invoke("Connect", userId);
        console.log("Successfully connected with userId:", userId);
      } else {
        console.error("Cannot invoke Connect - SignalR is not connected.");
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


  async connectWithInterests(userId: string, interests: string[]) {
    try {
      if (!userId) {
        console.error("User ID is missing! Cannot connect.");
        return;
      }
  
      this.currentUser = userId;  // ✅ Ensure user ID is assigned
      console.log(`User connected with interests. ID: ${this.currentUser}, Interests: ${interests}`);
  
      if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
        await this.startConnection();
      }
  
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        await this.hubConnection.invoke("ConnectWithInterests", userId, interests);
        console.log("Successfully connected with interests:", interests);
      } else {
        console.error("Cannot invoke ConnectWithInterests - SignalR is not connected.");
      }
    } catch (err) {
      console.error("Error invoking 'ConnectWithInterests':", err);
    }
  }
  


clearChat() {
  console.log("clearChat() called: Clearing chat messages...");

  console.log("Before clear:", this.messages$.value); // Log existing messages
  this.messages$.next([]); // Clear messages observable
  this.newMessage.next(""); // Notify subscribers
  console.log("After clear:", this.messages$.value); // Verify messages are cleared
}


async getMatchedUserInterests(): Promise<string[]> {
  try {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      const interests = await this.hubConnection.invoke<string[]>("GetMatchedUserInterests");
      console.log("Fetched matched user interests:", interests);
      return interests;
    } else {
      console.warn("Cannot fetch interests - SignalR is not connected.");
      return [];
    }
  } catch (err) {
    console.error("Error fetching matched user interests:", err);
    return [];
  }
}


startTyping(): void {
  if (!this.currentUser) {
    console.warn("startTyping() called but currentUser is not set!");
    return;
  }

  console.log(`startTyping() called - User: ${this.currentUser}`);

  if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
    this.hubConnection.invoke("StartTyping", this.currentUser)
      .then(() => console.log(`StartTyping event sent successfully for user: ${this.currentUser}`))
      .catch(err => console.error("Error sending typing event:", err));
  } else {
    console.warn("Cannot send StartTyping event - SignalR is not connected.");
  }
}


stopTyping(): void {
  if (!this.currentUser) {
    console.warn("stopTyping() called but currentUser is not set!");
    return;
  }

  console.log(`stopTyping() called - User: ${this.currentUser}`);

  if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
    this.hubConnection.invoke("StopTyping", this.currentUser)
      .then(() => console.log(`StopTyping event sent successfully for user: ${this.currentUser}`))
      .catch(err => console.error("Error sending stop typing event:", err));
  } else {
    console.warn("Cannot send StopTyping event - SignalR is not connected.");
  }
}


listenForTyping(callback: (user: string) => void): void {
  this.hubConnection.on("UserTyping", (user: string) => {
    callback(user);
  });
}


async markMessageAsRead(messageId: string, senderId: string) {
  if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
    await this.hubConnection.invoke("MarkMessageAsRead", messageId, senderId);
    console.log(`Marked message ${messageId} as read.`);
  } else {
    console.warn("Cannot mark message as read - SignalR is not connected.");
  }
}

// Listen for read receipt events from SignalR
listenForReadReceipts(callback: (messageId: string) => void): void {
  this.hubConnection.on("MessageRead", (messageId: string) => {
    console.log(`📩 Read receipt received: Message ID ${messageId}`);

    if (!messageId) {
      console.warn("⚠️ Received an invalid message ID for read receipt.");
      return;
    }

    // Subscribe to messages$ to check if the message exists
    this.messages$.subscribe(messages => {
      const messageExists = messages.some(msg => msg.id === messageId);
      
      if (messageExists) {
        console.log(`✅ Updating UI: Marking Message ID ${messageId} as read.`);
        callback(messageId); // Update UI
      } else {
        console.warn(`⚠️ Message ID ${messageId} not found in the message list.`);
      }
    });
  });

  console.log("👂 Listening for read receipts from SignalR...");
}




private typingTimeout(): void {
  setTimeout(() => {
    this.isTyping = false;
  }, 3000); // Reset after 3 seconds of inactivity
}




}
