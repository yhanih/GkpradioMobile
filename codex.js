import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runCodex() {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini", // you can change to code-davinci-002 if desired
      input:
        "Write a simple Express.js server with a /hello route that returns JSON.",
    });

    console.log("\n✅ Codex Response:\n");
    console.log(response.output[0].content[0].text);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

runCodex();

export default runCodex;
