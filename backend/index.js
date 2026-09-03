import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

dotenv.config();

const app = express();
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB cap

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    const { messages, systemPrompt } = req.body;

    const response = await client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
        ],
    });

    res.json({ reply: response.choices[0].message.content });
});

app.post('/extract-marksheet', upload.single('marksheet'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // extract raw text 
        const parsed = await pdfParse(req.file.buffer);
        const rawText = parsed.text;

        if (!rawText || rawText.trim().length < 20) {
            return res.status(422).json({ error: 'Could not read text from this PDF. It may be a scanned image rather than a digital PDF.' });
        }

        // structured JSON prompt
        const extractionPrompt = `You are a data extraction engine. You will be given raw text extracted from a college marksheet/grade sheet PDF. Extract every subject row into JSON.

For each subject, extract:
- "name": the subject name (clean it up, remove subject codes)
- "credits": the credit value as a number (this PDF includes a credits column, use it exactly as printed)
- "grade": the letter grade exactly as printed (e.g. O, A+, A, B+, B, C, RA, U, AB, W)
- "tag": predict ONE of these course categories based on the subject name: Core, BS, ES, PE, OE, Humanities, Lab
  - Use "Lab" for anything with "Laboratory", "Lab", or clearly hands-on/practical in the name
  - Use "Humanities" for subjects related to ethics, economics, management, communication, social sciences
  - Use "BS" (Basic Sciences) for math, physics, chemistry-type subjects
  - Use "ES" (Engineering Sciences) for foundational engineering subjects
  - Default to "Core" for major-specific technical subjects unless another tag clearly fits better
  - Use "OE" only if the subject name suggests it's an open elective outside the core discipline
  - Use "PE" if it's clearly a professional/departmental elective

Also extract the semester number if visible (as "semesterNumber", a number, or null if not found).

Return STRICT JSON ONLY, no markdown fences, no explanation, in this exact shape:
{
  "semesterNumber": <number or null>,
  "subjects": [
    { "name": "...", "credits": <number>, "grade": "...", "tag": "..." }
  ]
}

Here is the extracted text:
---
${rawText}
---`;

        const completion = await client.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: extractionPrompt }],
            temperature: 0.1,
        });

        let content = completion.choices[0].message.content.trim();
        content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

        let structured;
        try {
            structured = JSON.parse(content);
        } catch (parseErr) {
            console.error('Failed to parse LLM JSON output:', content);
            return res.status(500).json({ error: 'Could not parse the extracted data. Please try manual entry instead.' });
        }

        if (!Array.isArray(structured.subjects) || structured.subjects.length === 0) {
            return res.status(422).json({ error: 'No subjects could be found in this PDF.' });
        }

        res.json(structured);
    } catch (err) {
        console.error('Marksheet extraction failed:', err);
        res.status(500).json({ error: 'Failed to process the marksheet. Please try again or enter manually.' });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Backend running on port ${process.env.PORT}`);
});