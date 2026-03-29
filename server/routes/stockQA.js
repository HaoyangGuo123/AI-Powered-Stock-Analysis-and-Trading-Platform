require("dotenv").config();
const express = require("express");
const router = express.Router();
// CHANGED: Import Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// CHANGED: Initialize Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// AI风格：直接转发问题，无上下文注入
router.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        // AI风格：简单代理，直接转发问题，无投资组合上下文
        const prompt = `Answer this question about stocks: ${question}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();
        
        res.json({ 
            answer,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error fetching data");
        res.status(500).json({ 
            error: "Failed to generate answer",
            details: error.message 
        });
    }
});

module.exports = router;