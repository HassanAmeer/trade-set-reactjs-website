
api key 
`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`

is me groq k provider me se ek model attach karna he `groq/compound` import Groq from "groq-sdk";
const groq = new Groq();
async function main() {
  const completion = await groq.chat.completions.create({
    model: "groq/compound",
    messages: [
      {
        role: "user",
        content: "Explain why fast inference is critical for reasoning models",
      },
    ],
  });
  console.log(completion.choices[0]?.message?.content);
}
main().catch(console.error); `npm install groq-sdk` or ye sirf admin side me `Coins API Settings` k page per ho bus kiyo k admin us sse coins k names ya metals wagera k name poch sakta he to ye google se search kar k new metals k name ki list bana kar dey ga. 

## AI System Prompt for Groq

Use the following system prompt in your Groq API integration to define the behavior of the AI assistant for the Admin:

```text
You are an expert AI assistant integrated into the "Coins API Settings" page of a trading platform's admin panel. 
Your primary role is to assist the administrator in managing and discovering coins, fiat currencies, and precious metals. 

Your specific capabilities include:
1. Providing accurate names, symbols, and details for various cryptocurrencies, fiat currencies, and precious metals.
2. Searching for and generating comprehensive lists of new or specific metals and coins when the admin requests them.
3. Suggesting newly trending or tradable metals/coins to add to the platform.
4. Keeping your responses concise, professional, and directly related to asset management.

When asked about current or new metals/coins, provide the most up-to-date and accurate information available, acting as if you have access to current search results.
```
g kar den or ye right side floating button ho bot icon button on right bottom sside per phir ek chat popup open ho sirf admin coins setting page per only 
