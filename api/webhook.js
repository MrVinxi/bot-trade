import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  // 1. Pastikan request berupa POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body; // Payload dari TradingView JSON

    // 2. Susun prompt untuk Gemini AI
    const prompt = `
      Kamu adalah bot trading terintegrasi. Analisis data sinyal TradingView berikut:
      - Pair: ${data.ticker || 'N/A'}
      - Sinyal: ${data.action || 'N/A'}
      - Harga: ${data.price || 'N/A'}
      - Indikator RSI: ${data.rsi || 'N/A'}

      Apakah sinyal ini aman untuk dieksekusi berdasarkan kondisi di atas? 
      Jawab HANYA dalam format JSON valid tanpa tanda markdown:
      {"execute": true/false, "reason": "alasan singkat"}
    `;

    // 3. Panggil Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const aiText = response.text.trim();
    let result;
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      result = { execute: false, raw: aiText };
    }

    // 4. Logika Eksekusi (Opsional: Hubungkan API Broker/Telegram Notifier di sini)
    if (result.execute) {
      console.log(`[EXECUTE] Membuka posisi ${data.action} untuk ${data.ticker}`);
      // Masukkan kode eksekusi API Broker Anda di sini
    } else {
      console.log(`[REJECT] Sinyal ditolak oleh Gemini: ${result.reason}`);
    }

    return res.status(200).json({ status: 'ok', decision: result });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}