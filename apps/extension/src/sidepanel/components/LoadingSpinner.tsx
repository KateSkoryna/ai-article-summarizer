import { useEffect, useState } from "react";

const CYCLING_MESSAGES = [
  "Please wait...",
  "This can take a moment...",
  "Almost there...",
  "Good things take time...",
];

interface Props {
  text: string;
}

export function LoadingSpinner({ text }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % CYCLING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading">
      <div className="spinner" />
      <p>{text}</p>
      <p className="loading-hint">{CYCLING_MESSAGES[messageIndex]}</p>
    </div>
  );
}
