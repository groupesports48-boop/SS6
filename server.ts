import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High payload limit for image uploads
app.use(express.json({ limit: '25mb' }));

// Initialize Gemini SDK on server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint for OCR Screenshot analysis
app.post('/api/ocr-match-result', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    if (!ai) {
      // Return structured fallback so user can still manually confirm/edit
      return res.json({
        success: false,
        fallback: true,
        message: 'Gemini API key is not configured in server environment. Please use manual entry.',
        data: {
          matchNumber: `Match #${Math.floor(1 + Math.random() * 20)}`,
          tournamentName: 'Team Destroyed Scrims',
          playerName: 'DESTROYER_VIPER',
          kills: 0,
          placement: 1,
          points: 12,
          rankStatus: 'WIN',
          entryFee: 0,
          prizeWon: 0,
          map: 'Bermuda',
          gameMode: 'Battle Royale Squad',
          confidence: 'LOW',
          rawSummary: 'Manual entry recommended (API key unavailable).',
        },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `You are an expert Free Fire eSports referee and OCR scoreboard analyst for "Destroyed eSports Management".
Analyze this Free Fire match result screenshot, scoreboard, or points table screenshot.

Extract the following match details carefully:
1. matchNumber: The match or game number identified (e.g. "Match #1", "Game 2", or "FF-M" followed by number)
2. tournamentName: Tournament or scrim name shown (e.g. "Free Fire India Booyah Series" or "Team Destroyed Scrims")
3. playerName: The highlighted player In-Game Name (IGN) or squad name
4. kills: Number of kills achieved by the highlighted squad/player (number >= 0)
5. placement: Finish placement position/rank (e.g. 1 for Booyah / Winner, 2 for 2nd, etc.)
6. points: Total tournament score/points achieved (placement points + kill points)
7. rankStatus: "WIN" if placement is 1, "PODIUM" if placement is 2 or 3, "LOSS" if placement > 3
8. prizeWon: Any prize winnings indicated in INR (Rs.), or 0 if not indicated
9. entryFee: Any entry fee indicated in INR (Rs.), or 0 if not indicated
10. map: Map identified (one of: "Bermuda", "Purgatory", "Kalahari", "Nexterra", "Alpine")
11. gameMode: Mode identified (one of: "Battle Royale Squad", "Battle Royale Duo", "Battle Royale Solo", "Clash Squad 4v4")
12. confidence: "HIGH", "MEDIUM", or "LOW" based on text clarity in the screenshot
13. rawSummary: Concise 1-sentence description of the match result extracted from the screenshot

Return strictly a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchNumber: { type: Type.STRING },
            tournamentName: { type: Type.STRING },
            playerName: { type: Type.STRING },
            kills: { type: Type.INTEGER },
            placement: { type: Type.INTEGER },
            points: { type: Type.INTEGER },
            rankStatus: { type: Type.STRING },
            prizeWon: { type: Type.NUMBER },
            entryFee: { type: Type.NUMBER },
            map: { type: Type.STRING },
            gameMode: { type: Type.STRING },
            confidence: { type: Type.STRING },
            rawSummary: { type: Type.STRING },
          },
          required: ['matchNumber', 'kills', 'placement', 'rankStatus'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in OCR processing:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to analyze screenshot',
      fallback: true,
      data: {
        matchNumber: `Match #${Math.floor(1 + Math.random() * 20)}`,
        tournamentName: 'Team Destroyed Scrims',
        playerName: 'DESTROYER_VIPER',
        kills: 0,
        placement: 1,
        points: 12,
        rankStatus: 'WIN',
        entryFee: 0,
        prizeWon: 0,
        map: 'Bermuda',
        gameMode: 'Battle Royale Squad',
        confidence: 'LOW',
        rawSummary: 'OCR analysis failed. Please review and fill manually.',
      },
    });
  }
});

// Mount Vite middleware in development
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // In production, serve built files
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Destroyed eSports Management Server listening on port ${PORT}`);
});
