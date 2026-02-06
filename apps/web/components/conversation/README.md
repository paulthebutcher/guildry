# Chat UI Components

A set of React components for building conversational interfaces following UI_STANDARDS.md.

## Components

### ChatContainer

**Main container component that manages chat state and API interactions.**

```typescript
import { ChatContainer } from "@/components/conversation";

<ChatContainer conversationId="conv_123" />
```

**Features:**
- Fetches messages on mount
- Handles sending messages via API
- Shows loading state while AI responds
- Auto-updates when new messages arrive
- Error handling with user-friendly messages
- Shows typing indicator while AI is processing

**Props:**
- `conversationId: string` - The ID of the conversation

---

### MessageBubble

**Individual message display component with markdown support.**

```typescript
import { MessageBubble } from "@/components/conversation";

<MessageBubble
  role="user"
  content="Hello, I need help"
  timestamp={new Date()}
/>
```

**Features:**
- User messages: right-aligned, accent-blueprint background, white text
- Assistant messages: left-aligned, slate-100 background, slate-900 text
- Markdown rendering with code blocks and lists
- Relative timestamps (e.g., "2m ago", "yesterday")

**Props:**
- `role: "user" | "assistant"` - Who sent the message
- `content: string` - Message content (supports markdown)
- `timestamp?: Date` - When the message was sent

---

### MessageList

**Renders a list of messages with auto-scrolling.**

```typescript
import { MessageList } from "@/components/conversation";

<MessageList messages={messages} />
```

**Features:**
- Auto-scrolls to bottom when new messages added
- Shows empty state if no messages
- Smooth scroll behavior

**Props:**
- `messages: Message[]` - Array of message objects
  ```typescript
  interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }
  ```

---

### ChatInput

**Text input component with send button.**

```typescript
import { ChatInput } from "@/components/conversation";

<ChatInput
  onSend={(message) => console.log(message)}
  disabled={false}
  placeholder="Type your message..."
/>
```

**Features:**
- Auto-growing textarea (up to 4 lines)
- Submit on Enter (Shift+Enter for newline)
- Disabled state while sending
- Send button follows UI standards (accent-blueprint)

**Props:**
- `onSend: (message: string) => void` - Callback when message is sent
- `disabled?: boolean` - Disable input while sending
- `placeholder?: string` - Placeholder text

---

### TypingIndicator

**Animated dots to show AI is processing.**

```typescript
import { TypingIndicator } from "@/components/conversation";

{isTyping && <TypingIndicator />}
```

**Features:**
- Animated pulsing dots
- Follows assistant message styling
- Staggered animation delay

---

## Usage Example

### Basic Chat Page

```typescript
import { ChatContainer } from "@/components/conversation";

export default function ChatPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <h1 className="text-xl font-bold">Conversation</h1>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ChatContainer conversationId={params.id} />
      </div>
    </div>
  );
}
```

### Custom Integration

```typescript
"use client";

import { useState } from "react";
import { MessageList, ChatInput, TypingIndicator } from "@/components/conversation";

export function CustomChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    setIsLoading(true);
    
    // Add user message
    const userMsg = { 
      id: crypto.randomUUID(), 
      role: "user", 
      content,
      created_at: new Date().toISOString()
    };
    setMessages([...messages, userMsg]);

    // Call API
    const response = await fetch("/api/conversations/123/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    
    const { data } = await response.json();
    setMessages(prev => [...prev, data.assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        {isLoading && <TypingIndicator />}
      </div>
      
      <div className="border-t border-slate-200 p-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
```

## Styling

All components follow the UI_STANDARDS.md:

### Colors
- **User messages**: `accent-blueprint` (#0d9488) background, white text
- **Assistant messages**: `slate-100` background, `slate-900` text
- **Borders**: `slate-200`, `slate-300`
- **Text**: `slate-500`, `slate-600`, `slate-900`

### Spacing
- Message gaps: `mb-4` (1rem)
- Padding: `px-4 py-2` for bubbles, `p-4` for containers
- Input height: Auto-grow up to 4 lines (96px max)

### Typography
- Body text: Default (font-sans)
- Code blocks: `font-mono text-sm`
- Timestamps: `text-xs`

## Markdown Support

MessageBubble renders markdown with these features:
- Paragraphs with proper spacing
- Unordered and ordered lists
- Inline code with background highlighting
- Auto-linkify URLs
- Preserves newlines

Example:
```markdown
Here's a **bold** statement with `code`:

1. First item
2. Second item

Check out https://example.com
```

## Accessibility

- Semantic HTML elements
- Proper focus states on interactive elements
- Keyboard navigation support
- ARIA labels where needed
- Clear visual feedback for disabled states

## Performance

- Auto-scroll uses `scrollIntoView` with smooth behavior
- Textarea height calculation is efficient
- Messages are keyed by ID for optimal React rendering
- Loading states prevent multiple simultaneous requests

## Error Handling

ChatContainer handles errors gracefully:
- Failed to load messages: Shows error message with retry option
- Failed to send message: Shows error, doesn't clear input
- Network errors: User-friendly error messages

## Browser Support

Components work in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Dependencies

- `react-markdown`: For rendering markdown content
- React 18+ built-in hooks
- Next.js 14 App Router
