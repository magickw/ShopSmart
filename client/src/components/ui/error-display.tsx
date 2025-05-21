import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export default function ErrorDisplay({ title, message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-error bg-opacity-10 p-4 rounded-full mb-4">
        <AlertCircle className="text-error h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium text-neutral-800 mb-2">{title}</h3>
      <p className="text-neutral-600 text-center mb-6">{message}</p>
      <Button onClick={onRetry} className="bg-primary text-white px-6 py-2 rounded-lg font-medium">
        Try Again
      </Button>
    </div>
  );
}
