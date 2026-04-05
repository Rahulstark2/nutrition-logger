require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Supabase credentials not fully provided in ENV.");
}

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

// Initialize Gemini
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Analyze image and save to Supabase
app.post('/api/analyze', async (req, res) => {
  try {
    const { userId, textQuery, imageUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (!textQuery && !imageUrl) {
      return res.status(400).json({ error: 'Must provide either textQuery or imageUrl' });
    }

    let payloadParts = [];
    const prompt = `You are a strict nutritional calculator. Look at the image (or text) and output ONLY the nutritional values strictly following this JSON schema: 
{ "food_name": "string", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number }
IMPORTANT: The 'food_name' MUST reflect the exact item and quantity passed in (e.g., if the query is "1 banana", the food_name must literally be "1 banana", not just "banana").
Do not provide any markdown formatting or explanations.`;

    if (textQuery) {
      payloadParts.push(textQuery);
    } 

    if (imageUrl) {
      // In a real scenario, you'd fetch the image data as base64 to send to Gemini
      // or send the URI if Gemini natively supports external URIs depending on the SDK version.
      // Assuming we fetch it and send base64:
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      payloadParts.push({
        inlineData: {
          data: base64,
          mimeType
        }
      });
    }

    payloadParts.push(prompt);

    // Call Gemini
    console.log(`\n[API] Calling Gemini API...`);
    console.log(`[API] Query input: "${textQuery || 'N/A'}", Image attached: ${!!imageUrl}`);
    
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(payloadParts);
    let outputText = result.response.text();
    
    console.log(`[API] Gemini API call successful!`);
    console.log(`[API] Raw AI Response:\n${outputText}\n`);
    
    // Clean up potential markdown formatting from Gemini response (e.g. ```json ... ```)
    outputText = outputText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(outputText);
    } catch(e) {
      console.error("Failed to parse Gemini output:", outputText);
      return res.status(500).json({ error: 'AI returned invalid JSON format' });
    }

    return res.json({ success: true, log: parsedData });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New endpoint to specifically save logs into DB
app.post('/api/log', async (req, res) => {
  const { userId, foodData } = req.body;
  if (!userId || !foodData) {
    return res.status(400).json({ error: 'Missing userId or foodData' });
  }

  try {
    const { data: logEntry, error: dbError } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        food_name: foodData.food_name,
        calories: foodData.calories,
        protein_g: foodData.protein_g,
        carbs_g: foodData.carbs_g,
        fat_g: foodData.fat_g,
        fiber_g: foodData.fiber_g,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      return res.status(500).json({ error: 'Database insertion failed', details: dbError });
    }

    return res.json({ success: true, log: logEntry });
  } catch (error) {
    console.error("Log Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend service listening on port ${PORT}`);
});
