import { useCallback, useRef, useState, useEffect } from 'react';

interface TTSOptions {
    rate?: number; // 0.1 - 10, default 1
    pitch?: number; // 0 - 2, default 1
    volume?: number; // 0 - 1, default 1
    lang?: string; // 'id-ID'
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
}

export function useTTS(options: TTSOptions = {}) {
    const { rate = 0.95, pitch = 1.0, volume = 1.0, lang = 'id-ID' } = options;

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Initialize voices
    useEffect(() => {
        if (!('speechSynthesis' in window)) return;

        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback(
        (text: string) => {
            if (!('speechSynthesis' in window)) {
                console.warn('TTS tidak didukung browser ini');
                return;
            }

            // Hentikan TTS sebelumnya jika masih berjalan
            window.speechSynthesis.cancel();
            setIsSpeaking(true);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;

            // Pilih voice Indonesia jika tersedia
            const indonesianVoice = voices.find((v) => v.lang === 'id-ID' || v.lang === 'id_ID');
            if (indonesianVoice) {
                utterance.voice = indonesianVoice;
            }

            utterance.onend = () => {
                setIsSpeaking(false);
                options.onEnd?.();
            };

            utterance.onerror = (e) => {
                setIsSpeaking(false);
                options.onError?.(e);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        },
        [rate, pitch, volume, lang, voices, options],
    );

    const stop = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return { speak, stop, isSpeaking, voices };
}
