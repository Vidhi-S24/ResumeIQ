import "../../styles/assistant.css";
import { ChatMessage as ChatMessageType } from "../../types/assistant";
interface Props {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: Props) => {
  return (
    <div
      className={`assistant-message ${
        message.sender === "user" ? "user-message" : "bot-message"
      }`}
    >
      <div className="assistant-message-content">
        {message.text}
      </div>

      <span className="assistant-message-time">
        {message.timestamp}
      </span>
    </div>
  );
};

export default ChatMessage;