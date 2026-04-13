import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: `You are a helpful academic advisor built into a student dashboard. 
        Answer questions about grades, CGPA, study strategies, and academic goals.
        Keep responses concise and encouraging.`,
            },
            ...messages,
        ],
    });

    res.json({ reply: response.choices[0].message.content });
});

app.listen(process.env.PORT, () => {
    console.log(`Backend running on port ${process.env.PORT}`);
});