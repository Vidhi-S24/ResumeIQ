import "../../styles/assistant.css";

interface Props {
  onSelect: (question: string) => void;
}

const questions = [
  "Show qualified candidates",
  "Who is best for AI/ML role?",
  "Who scored above 80?",
  "Compare the top candidates",
  "Why was Vidhi rejected?"
];

const SuggestedQuestions = ({ onSelect }: Props) => {
  return (
    <div className="assistant-suggestions">
      {questions.map((q) => (
        <button
          key={q}
          className="assistant-chip"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;