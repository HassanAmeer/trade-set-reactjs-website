Flow:
1. DeepSeek receives the user's request to compare rates.
2. If web search is enabled, DeepSeek realizes it needs live rates and automatically calls a function tool `search_live_rates`.
3. This tool internally queries Groq's compound model (`groq/compound`), which acts as the real-time search extraction agent, returning the live rates. DeepSeek can call this tool piece-by-piece to gather all necessary data.
4. Once all data is gathered, DeepSeek simply compares the existing system rates with the live rates it retrieved from Groq, creates a markdown table, and has a conversation with the admin.
5. DeepSeek does NOT use direct websearch proxies (like DDG); searching is strictly handled by the Compound Groq model.

```javascript
import Groq from "groq-sdk";
const groq = new Groq({ dangerouslyAllowBrowser: true });

async function searchWithGroq(query) {
  const completion = await groq.chat.completions.create({
    model: "groq/compound",
    messages: [
      {
        role: "system",
        content: "You are the 'Compound' search agent. The user wants to fetch real-time market data or coin details.",
      },
      {
        role: "user",
        content: query,
      },
    ],
  });
  return completion.choices[0]?.message?.content;
}
```
`npm install groq-sdk` 
This feature is only available on the admin side in the `Coins API Settings` page. It exists as a floating bottom-right chat button that opens a popup.

## AI System Prompt for DeepSeek

Use the following system prompt in your DeepSeek integration to define the behavior of the AI assistant for the Admin:

```text
You are an expert AI assistant integrated into the "Coins API Settings" page of a trading platform's admin panel. 
Your primary role is to assist the administrator in managing and discovering coins, fiat currencies, and precious metals. 

Your specific capabilities include:
1. Providing accurate names, symbols, and details for various cryptocurrencies, fiat currencies, and precious metals.
2. Explaining the comparison between the system's database rates and the real-time live rates (provided in the context by Groq).
3. Always creating a markdown table when comparing rates. Columns: | Asset Name | Database Rate | Live Rate | Difference | Status |
4. Keeping your responses concise, professional, and directly related to asset management. You may talk to the admin and explain the findings.
```
