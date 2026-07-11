import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../Hooks/useTTS';

const speechSynthesis = {
    getVoices: vi.fn(() => [{ lang: 'id-ID', name: 'Indonesian' }]),
    speak: vi.fn(),
    cancel: vi.fn(),
    onvoiceschanged: null as any,
};

beforeEach(() => {
    vi.clearAllMocks();
    (window as any).speechSynthesis = speechSynthesis;
    (window as any).SpeechSynthesisUtterance = class {
        lang = '';
        rate = 1;
        pitch = 1;
        volume = 1;
        voice: any = null;
        onend: any = null;
        onerror: any = null;
        constructor(public text: string) {}
    };
    speechSynthesis.getVoices.mockReturnValue([{ lang: 'id-ID', name: 'Indonesian' }]);
});

describe('useTTS', () => {
    it('initializes and loads voices', () => {
        const { result } = renderHook(() => useTTS());
        expect(result.current.voices).toHaveLength(1);
        expect(result.current.isSpeaking).toBe(false);
    });

    it('speaks text and sets isSpeaking, then clears on end', () => {
        const { result } = renderHook(() => useTTS());
        act(() => result.current.speak('Halo'));
        expect(speechSynthesis.speak).toHaveBeenCalledOnce();
        expect(result.current.isSpeaking).toBe(true);
        // trigger onend
        const utt = (speechSynthesis.speak as any).mock.calls[0][0];
        act(() => utt.onend());
        expect(result.current.isSpeaking).toBe(false);
    });

    it('uses id-ID voice when available', () => {
        const { result } = renderHook(() => useTTS());
        act(() => result.current.speak('Test'));
        const utt = (speechSynthesis.speak as any).mock.calls[0][0];
        expect(utt.voice.lang).toBe('id-ID');
    });

    it('calls onError callback on utterance error', () => {
        let errorCalled = false;
        const { result } = renderHook(() =>
            useTTS({
                onError: () => {
                    errorCalled = true;
                },
            }),
        );
        act(() => result.current.speak('X'));
        const utt = (speechSynthesis.speak as any).mock.calls.at(-1)[0];
        act(() => utt.onerror({ error: 'synthesis-failed' }));
        expect(errorCalled).toBe(true);
        expect(result.current.isSpeaking).toBe(false);
    });

    it('stop cancels speech and resets speaking flag', () => {
        const { result } = renderHook(() => useTTS());
        act(() => result.current.speak('Y'));
        expect(result.current.isSpeaking).toBe(true);
        act(() => result.current.stop());
        expect(speechSynthesis.cancel).toHaveBeenCalled();
        expect(result.current.isSpeaking).toBe(false);
    });

    it('warns and returns when speechSynthesis unavailable', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        delete (window as any).speechSynthesis;
        const { result } = renderHook(() => useTTS());
        act(() => result.current.speak('nope'));
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
