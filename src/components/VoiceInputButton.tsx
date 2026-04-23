// Voice input button using browser Web Speech API.
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  onTranscript: (text: string) => void;
};

// Minimal types for Web Speech API (not in standard lib).
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceInputButton({ onTranscript }: Props) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recRef.current?.stop(), []);

  const start = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      onTranscript(text);
    };
    rec.onerror = (e) => {
      toast.error(`Voice error: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => recRef.current?.stop();

  return (
    <Button
      type="button"
      variant={listening ? "destructive" : "outline"}
      size="sm"
      onClick={listening ? stop : start}
    >
      {listening ? (
        <>
          <MicOff className="mr-1 h-4 w-4" /> Stop
        </>
      ) : (
        <>
          <Mic className="mr-1 h-4 w-4" /> Dictate
        </>
      )}
    </Button>
  );
}
