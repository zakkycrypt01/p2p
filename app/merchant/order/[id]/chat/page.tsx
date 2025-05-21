"use client"
import { useParams } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { useZKChat } from "@/hooks/use-zk-chat"
import { ZKChatMessage } from "@/components/chat/zk-chat-message"
import { ZKChatInput } from "@/components/chat/zk-chat-input"
import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MerchantChatPage() {
  const params = useParams()
  const orderId = params.id as string
  const { address } = useSuiWallet()

  const { messages, isLoading, isInitializing, sendMessage, uploadFile, isEncrypted, isAuthenticated } = useZKChat({
    orderId,
    autoFetchMessages: true,
  })

  const handleSendMessage = async (message: string, isAnonymous: boolean) => {
    await sendMessage(message, isAnonymous)
  }

  const handleSendFile = async (file: File, isAnonymous: boolean) => {
    await uploadFile(file, isAnonymous)
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded mb-2"></div>
          <div className="h-3 w-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/merchant/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Order
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Secure Chat</h1>
          {isAuthenticated && (
            <div className="flex items-center text-sm text-green-500">
              <Shield className="h-4 w-4 mr-1" />
              <span>ZK Protected</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">Order #{orderId.slice(0, 8)}</p>
      </div>

      <div className="bg-card rounded-lg shadow-sm border p-4">
        <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
          {isLoading && messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-10 bg-muted rounded w-1/2 mx-auto"></div>
                <div className="h-10 bg-muted rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground">Start the conversation about this order.</p>
            </div>
          ) : (
            messages.map((message) => <ZKChatMessage key={message.orderId} message={message} currentUser={address || ""} />)
          )}
        </div>

        <ZKChatInput
          onSendMessageAction={handleSendMessage}
          onSendFileAction={handleSendFile}
          isLoading={isLoading}
          isEncrypted={isEncrypted}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}
