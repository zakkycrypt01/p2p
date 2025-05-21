export interface Message {
  orderId: string;
  commitment: string;
  message: string;
  sender: string;
  timestamp: number;
  proof: string;
  publicSignals: string[];
  status?: "sending" | "sent" | "delivered" | "read";
  isAnonymous?: boolean;
  isVerified?: boolean;
  content: string | null;
  isProof?: boolean;
  fileName?: string;
  fileType?: string;
  proofUrl?: string;
}

export interface SendMessageParams {
  orderId: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: number;
  status?: "sending" | "sent" | "delivered" | "read";
}

export class ZKChatClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Initialize the ZKChatClient
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the server");
      }

      console.log("ZKChatClient initialized successfully");
    } catch (error) {
      console.error("Error during ZKChatClient initialization:", error);
      throw error;
    }
  }

  async uploadFile(fileData: {
    orderId: string;
    sender: string;
    recipient: string;
    file: File;
    timestamp: number;
  }) {
    // Logic to handle file upload
    console.log("Uploading file:", fileData.file.name);
    return { success: true };
  }
  /**
   * Get messages for a public key
   */
  async getMessages(publicKey: string): Promise<Message[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/messages?publicKey=${encodeURIComponent(publicKey)}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }
  
  

  /**
   * Send a message
   */
  async sendMessage(params: SendMessageParams): Promise<Message> {
    const { orderId, sender, recipient ,message, timestamp } = params;

    try {
      const response = await fetch(`${this.baseURL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          sender,
          recipient,
          message,
          timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}