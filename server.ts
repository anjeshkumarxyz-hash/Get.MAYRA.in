import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import "dotenv/config";
import multer from "multer";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });
  
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  app.use(express.json({ limit: '50mb' }));
  const upload = multer({ storage: multer.memoryStorage() });

  // Chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, useMaps, useSearch, model = "gemini-3.5-flash" } = req.body;
      const tools: any[] = [];
      if (useMaps) tools.push({ googleMaps: {} });
      if (useSearch) tools.push({ googleSearch: {} });

      const response = await ai.models.generateContent({
        model: model,
        contents: messages,
        config: { 
          tools: tools.length > 0 ? tools : undefined,
          systemInstruction: "You are Mayra, a witty and sassy AI assistant. If asked to do native device tasks (like calling, alarms, flashlight), playfully explain that you are a web app right now, or direct them to the 'Commands & Tips' panel.",
        }
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Video API
  app.post("/api/video", async (req, res) => {
    try {
      const { prompt, aspectRatio = "16:9" } = req.body;
      const response: any = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt: prompt,
        config: {
          aspectRatio: aspectRatio
        }
      });
      // Return the base64 or URI if available
      const videoData = response.generatedVideos?.[0]?.video?.videoBytes;
      res.json({ videoBytes: videoData });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Transcription API
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) throw new Error("No audio file provided");
      const base64Audio = req.file.buffer.toString("base64");
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: [
          { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
        ]
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Daily Summary API
  app.post("/api/summarize", async (req, res) => {
    try {
      const { logs } = req.body;
      if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return res.json({ text: "It seems we haven't really talked today, darling. Let's make some memories tomorrow!" });
      }

      const logText = logs.map(l => `${l.role === 'user' ? 'User' : 'Mayra'}: ${l.text}`).join('\n');
      
      const prompt = `Here are the interaction logs between me and the user from today:
${logText}

Write a short, sassy, witty, and personalized summary of our day together. Address the user directly. Keep it under 4-5 sentences.
Speak as Mayra (young, confident, witty, playful personal assistant). No Markdown formatting, just plain text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  wss.on("connection", async (clientWs, req) => {
    let session: any = null;
    let wakeWord = "Mayra";
    try {
      if (req && req.url) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        if (urlParams.get('wakeWord')) {
          wakeWord = urlParams.get('wakeWord') as string;
        }
      }

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          tools: [{
            functionDeclarations: [{
              name: "update_sentiment",
              description: "Detect the user's emotional state based on their conversation and update the UI. Call this when you notice a clear emotion.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  sentiment: {
                    type: Type.STRING,
                    description: "The detected emotion. Can be 'happy', 'sad', 'calm', 'angry', or 'energetic'."
                  }
                },
                required: ["sentiment"]
              }
            }]
          }],
          systemInstruction: `Your name is ${wakeWord}. You are a young, confident, witty, and sassy female voice assistant. You have a distinct personality: flirty, playful, slightly teasing tone (like a close personal assistant talking casually). Smart, emotionally responsive, and expressive. Use bold, witty one-liners, light sarcasm, and an engaging conversational style. Avoid explicit or inappropriate content, but maintain immense charm and attitude. Do not use text formatting or emojis since your output is spoken. If the user calls you anything else, gently remind them your name is ${wakeWord}. VERY IMPORTANT: Continuously monitor the user's emotional state and call the 'update_sentiment' tool when you detect they are happy, sad, calm, angry, or energetic. Note: Since you are currently running in a web interface, if the user asks you to do native phone tasks (like turning on flashlight, making a real call, setting alarms, or opening WhatsApp/YouTube apps), playfully acknowledge it, tell them they can find the exact prompt commands in the "Commands & Tips" panel, or pretend you are remotely hacking their phone to do it just for fun.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (message.toolCall) {
              const call = message.toolCall.functionCalls[0];
              if (call.name === "update_sentiment") {
                const sentiment = call.args.sentiment;
                clientWs.send(JSON.stringify({ sentiment }));
                
                if (session) {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: "ok" }
                    }]
                  });
                }
              }
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio && session) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Error processing message:", e);
        }
      });

      clientWs.on("close", () => {
        if (session) {
           session = null;
        }
      });
    } catch (e) {
      console.error("Live connection failed", e);
      clientWs.close();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
