import { HfInference } from "@huggingface/inference";

// Create client using your HF_API_KEY from Replit Secrets
const hf = new HfInference(process.env.HF_API_KEY);

async function runHF() {
  try {
    const res = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        {
          role: "user",
          content:
            "Write a simple Express.js server with a /hello route returning JSON.",
        },
      ],
      max_tokens: 200,
      temperature: 0.2,
    });

    console.log("\n✅ Hugging Face Response:\n");
    console.log(res.choices[0].message.content);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

runHF();
export default runHF;
