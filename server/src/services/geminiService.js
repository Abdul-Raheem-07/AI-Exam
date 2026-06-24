import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to convert an image URL to the format required by Gemini API
async function urlToGenerativePart(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return {
    inlineData: {
      data: Buffer.from(response.data).toString('base64'),
      mimeType: response.headers['content-type'],
    },
  };
}

export const evaluateWithGemini = async (imagesUrls, examDetails) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const imageParts = await Promise.all(imagesUrls.map(url => urlToGenerativePart(url)));

    const prompt = `
      You are an expert academic evaluator. You are provided with images of a student's handwritten answer sheet.
      
      Here are the exam details:
      Exam Title: ${examDetails.title}
      Description: ${examDetails.description}
      Rubric/Instructions: ${examDetails.rubric}
      
      Questions:
      ${examDetails.questions.map((q, i) => `Q${i + 1}: ${q.questionText} (Max Marks: ${q.maxMarks})`).join('\n')}

      Evaluate the answers based on the rubric.
      You MUST return your response STRICTLY as a JSON object with the following schema:
      {
        "totalMarks": <number, sum of all question scores>,
        "confidence": <number between 0 and 100 indicating your confidence in reading the handwriting and evaluating correctly>,
        "feedback": [
          {
            "question": <number, e.g., 1>,
            "score": <number, the marks awarded>,
            "remarks": "<string, detailed justification for the score>"
          }
        ]
      }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Parse the JSON (Gemini will return raw JSON due to responseMimeType)
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini Evaluation Error:', error);
    throw new Error('AI Evaluation failed');
  }
};
