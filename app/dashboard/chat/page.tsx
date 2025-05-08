import { PageTitle } from "@/components/page-title"
import { BookChatInterface } from "@/components/chat/book-chat-interface"

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Chat" description="Communicate with other students and teachers" />
      <div className="h-[calc(100vh-200px)]">
        <BookChatInterface />
      </div>
    </div>
  )
}
