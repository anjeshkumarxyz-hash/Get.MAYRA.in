import { useRef, useState, useEffect, useCallback } from 'react';
import { pcmToBase64, base64ToPcm } from './audio';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useVoiceAssistant(wakeWord: string = 'Mayra', speechRate: number = 1.0) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const speechRateRef = useRef(speechRate);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setStatus('connecting');
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?wakeWord=${encodeURIComponent(wakeWord)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 128;
      inputAnalyserRef.current = inputAnalyser;

      const outputAnalyser = outputCtx.createAnalyser();
      outputAnalyser.fftSize = 128;
      outputAnalyser.connect(outputCtx.destination);
      outputAnalyserRef.current = outputAnalyser;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(inputAnalyser);
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onopen = () => {
        setIsConnected(true);
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          setIsSpeaking(true);
          const pcm = base64ToPcm(msg.audio);
          const buffer = outputCtx.createBuffer(1, pcm.length, outputCtx.sampleRate);
          buffer.getChannelData(0).set(pcm);

          const audioSource = outputCtx.createBufferSource();
          audioSource.buffer = buffer;
          audioSource.connect(outputAnalyser);
          audioSource.playbackRate.value = speechRateRef.current;

          if (nextStartTimeRef.current < outputCtx.currentTime) {
            nextStartTimeRef.current = outputCtx.currentTime;
          }

          audioSource.start(nextStartTimeRef.current);
          nextStartTimeRef.current += (buffer.duration / speechRateRef.current);
          
          sourcesRef.current.push(audioSource);
          
          audioSource.onended = () => {
             sourcesRef.current = sourcesRef.current.filter(s => s !== audioSource);
             if (sourcesRef.current.length === 0) {
                 setIsSpeaking(false);
             }
          };
        }
        
        if (msg.interrupted) {
          sourcesRef.current.forEach(s => {
             try { s.stop(); } catch(e) {}
          });
          sourcesRef.current = [];
          nextStartTimeRef.current = outputCtx.currentTime;
          setIsSpeaking(false);
        }

        if (msg.sentiment) {
          setSentiment(msg.sentiment);
        }
      };

      ws.onclose = () => {
        disconnect();
      };

    } catch (err: any) {
      setError(err.message);
      setStatus('error');
      disconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsSpeaking(false);
    setStatus((prev) => (prev === 'error' ? 'error' : 'disconnected'));
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    if (inputCtxRef.current) {
      inputCtxRef.current.close();
      inputCtxRef.current = null;
    }
    
    if (outputCtxRef.current) {
      outputCtxRef.current.close();
      outputCtxRef.current = null;
    }
    
    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    sourcesRef.current = [];
    nextStartTimeRef.current = 0;
  }, []);

  return { 
    isConnected, 
    isSpeaking, 
    sentiment,
    error, 
    status, 
    connect, 
    disconnect,
    inputAnalyser: inputAnalyserRef.current,
    outputAnalyser: outputAnalyserRef.current
  };
}
