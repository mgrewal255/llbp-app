// Backend: Node.js + OpenAI API
// File: server/server.js
// server/server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const mammoth = require("mammoth");
const { Document, Packer, Paragraph, TextRun } = require("docx");
require("dotenv").config();

(async () => {
  const { OpenAI } = await import("openai");
  const nodeFetch = await import("node-fetch");
  const { Blob } = await import("buffer");
  const FormData = (await import("formdata-node")).FormData;

  globalThis.fetch = nodeFetch.default;
  globalThis.Headers = nodeFetch.Headers;
  globalThis.Request = nodeFetch.Request;
  globalThis.Response = nodeFetch.Response;
  globalThis.Blob = Blob;
  globalThis.FormData = FormData;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const app = express();
  const upload = multer({ dest: "uploads/" });
  const allowedOrigin = "https://llbp-backend.onrender.com"; // Replace with actual frontend URL in production

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST"],
    credentials: true,
  })
);


  app.post("/process", upload.single("report"), async (req, res) => {
    const reportPath = req.file.path;

    try {
      const reportText = await mammoth.extractRawText({ path: reportPath }).then(r => r.value);

      const systemPrompt = "You are a professional technical writer generating Lessons Learned and Best Practices (LLBP) reports. Your task is to write a concise, professional, and well-structured LLBP Briefing based on an incident or investigation report. The output must follow a strict format, use bold paragraph titles, and include bullet points where appropriate. The final output will be converted into a Word document, so formatting must be clean and consistent.";

      const userPrompt = `**Generate a Lessons Learned and Best Practices (LLBP) Briefing using the following report. Do NOT include any sections other than those listed below.** Format the output using bold paragraph titles and include bullet points where suitable. Follow the structure exactly as shown:\n\n**Title:**\nWrite a headline-style title that grabs attention.\n\n**Discussion:**\nWrite this section in full paragraph style only. Do NOT use bullet points or list formatting in this section.\n- Clearly explain the core lesson learned and why the lesson learned is important (e.g., raise awareness, caution others, or encourage best practice).\n- Provide necessary background/context on what the issue is. \n- Identify the actual or potential benefits of applying the lesson learned. \n-Do not list any causes in this section. \n\n**Analysis:** Include high-level causes with brief summary of facts for each cause. \n\n**Actions to Prevent Recurrence:**\n- Based on apparent and contributing causes, what actions would prevent recurrence\n- Avoid copying corrective actions from the source material\n- Make suggestions broadly applicable to other teams\n\nDO NOT include any other section titles. Do not include 'Extent of Condition', 'Management Concerns', or 'Lessons Learned' sections.\n\n---\n\nReport:\n${reportText}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const populatedText = completion?.choices?.[0]?.message?.content || "GPT did not return a response.";

      const paragraphs = [];
      let lastWasHeader = false;

      populatedText.split("\n").forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
          if (!lastWasHeader) {
            paragraphs.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
          }
          lastWasHeader = false;
        } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          paragraphs.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: trimmed.replace(/\*\*/g, ""), bold: true })],
            })
          );
          lastWasHeader = true;
        } else if (trimmed.startsWith("- ")) {
          const bulletText = trimmed.substring(2);
          paragraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [new TextRun(bulletText.replace(/\*\*/g, ""))],
            })
          );
          lastWasHeader = false;
        } else {
          paragraphs.push(
            new Paragraph({ spacing: { after: 40 }, children: [new TextRun(trimmed.replace(/\*\*/g, ""))] })
          );
          lastWasHeader = false;
        }
      });

      const doc = new Document({
        creator: "LLBP Generator",
        title: "LLBP Briefing",
        description: "Generated Lessons Learned and Best Practices Document",
        sections: [{ properties: {}, children: paragraphs }],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", "attachment; filename=LLBP_Briefing.docx");
      res.send(buffer);

      fs.unlinkSync(reportPath);
    } catch (err) {
      console.error("❌ DOCX Error:", err);
      res.status(500).json({ error: err.message || "Internal server error." });
    }
  });

  const PORT = process.env.PORT || 5000;app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));

})(); 

