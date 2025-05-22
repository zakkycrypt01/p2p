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
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async initialize(): Promise<void> {
    // Initialization logic here
  }

  async getMessages(publicKey: string, orderId: string): Promise<Message[]> {
    const response = await fetch(`${this.apiUrl}/api/messages?publicKey=${publicKey}&orderId=${orderId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }
    return await response.json();
  }

  async sendMessage(data: { orderId: string; sender: string; recipient: string; message: string; timestamp: number }): Promise<Message> {
    console.log("Sending payload:", data); // Log the payload
    const response = await fetch(`${this.apiUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text(); // Log server response for debugging
      console.error("Server error response:", errorText);
      throw new Error("Failed to send message");
    }
    return await response.json();
  }

  async uploadFile(data: { orderId: string; sender: string; recipient: string; file: File; timestamp: number }): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append("orderId", data.orderId);
    formData.append("sender", data.sender);
    formData.append("recipient", data.recipient);
    formData.append("file", data.file);
    formData.append("timestamp", data.timestamp.toString());

    const response = await fetch(`${this.apiUrl}/files`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload file");
    }
    return await response.json();
  }

  async pollMessages(publicKey: string, orderId: string, callback: (messages: Message[]) => void): Promise<void> {
    setInterval(async () => {
      try {
        const messages = await this.getMessages(publicKey, orderId);

        const enrichedMessages = messages.map((msg) => ({
          ...msg,
          content: msg.message || null, 
          status: msg.status || "sent", 
        }));

        callback(enrichedMessages);
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    }, 30000); // 1 minute interval
  }
}