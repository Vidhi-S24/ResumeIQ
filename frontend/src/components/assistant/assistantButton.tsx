import "../../styles/assistant.css";

interface Props {
  onClick: () => void;
}

const AssistantButton = ({ onClick }: Props) => {
  return (
    <button
      className="assistant-floating-button"
      onClick={onClick}
    >
      🤖
    </button>
  );
};

export default AssistantButton;