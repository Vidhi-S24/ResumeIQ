import { useEffect, useRef, useState } from "react";
import "../../styles/assistant.css";

import ChatMessage from "./chatMessage";
import { askAssistant, type ChatHistory } from "../../api/assistant";
import type { ChatMessage as ChatMessageType } from "../../types/assistant";
interface Props {
    open: boolean;
    onClose: () => void;
}

const AssistantDrawer = ({ open, onClose }: Props) => {
    const [messages, setMessages] = useState<ChatMessageType[]>([
        {
            id: "welcome",
            sender: "assistant",
            text:
                "Hi! I'm ResumeIQ Assistant.\n\nI can help you:\n• Find qualified candidates\n• Compare resumes\n• Explain screening scores\n• Search skills and experience\n• Answer hiring-related questions",
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessageType = {
            id: Date.now().toString(),
            sender: "user",
            text: input,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setMessages((prev) => [...prev, userMessage]);

        const question = input;
        setInput("");
        setLoading(true);

        try {
            const updatedMessages = [...messages, userMessage];

            const history: ChatHistory[] = updatedMessages.map((message) => ({
                role: message.sender,
                content: message.text,
            }));

            const response = await askAssistant(question, history);

            const botMessage: ChatMessageType = {
                id: `${Date.now()}-assistant`,
                sender: "assistant",
                text: response.answer,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error(error);

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-error`,
                    sender: "assistant",
                    text:
                        "Sorry, something went wrong while contacting the assistant.",
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <div className={`assistant-drawer ${open ? "open" : ""}`}>
            <div className="assistant-header">
                <div>
                    <h3>ResumeIQ Assistant</h3>
                    <span>AI Hiring Assistant</span>
                </div>

                <button
                    className="assistant-close"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            <div className="assistant-messages">
                {messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                    />
                ))}

                {loading && (
                    <div className="assistant-typing">
                        Assistant is typing...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="assistant-input">
                <input
                    type="text"
                    placeholder="Ask about candidates..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />

                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default AssistantDrawer;