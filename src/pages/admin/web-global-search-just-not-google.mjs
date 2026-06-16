import OpenAI from "openai";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline";

puppeteer.use(StealthPlugin());

const apiKey = Buffer.from("c2stOUlPQ0dvNFZva05PUEE4OGl0T0FIMkNYSkp6bE9yQWNNdHBpb0s2ajVWOUM4WDdOS0w1SXNhZFNmeG5DOHlFVw==", "base64").toString("utf-8");

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://opencode.ai/zen/v1",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// Tool 1: Internet par aam search karne ke liye
async function searchWebWithPuppeteer(searchQuery) {
  try {
    console.log(`\n🔍 Internet par search kar raha hai: "${searchQuery}"...`);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&ia=web`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const textContent = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      return document.body.innerText;
    });
    await browser.close();

    // AI ko data ke sath source bhi denge taake usko pata ho ke kahan se parha hai
    return `Source: DuckDuckGo Search Engine\n\nData:\n${textContent.replace(/\s+/g, ' ').substring(0, 8000)}`;
  } catch (error) {
    return `Error searching web: ${error.message}`;
  }
}

// Tool 2: Direct kisi specific URL / Link ko parhne ke liye
async function fetchWebsiteDirectly(url) {
  try {
    console.log(`\n🌐 Website ka data nikal raha hai: "${url}"...`);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const textContent = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      return document.body.innerText;
    });
    await browser.close();

    // AI ko website ka link bhi denge taake usko source yaad rahe
    return `Source: ${url}\n\nData:\n${textContent.replace(/\s+/g, ' ').substring(0, 8000)}`;
  } catch (error) {
    return `Error fetching website: ${error.message}`;
  }
}

async function startGlobalSearch() {
  console.log("\n=======================================================");
  console.log("🌍 AI Global Search Assistant (Chat Memory Enabled)");
  console.log("=======================================================\n");
  console.log("💡 Tip: Type 'clear' to start a new chat. Type 'exit' to close.\n");

  let messages = [
    {
      role: "system",
      content: `You are an autonomous AI web assistant. Today's date is ${new Date().toDateString()}. 
If the user provides a specific URL or link in their text, use the 'fetch_website' tool to visit it.
If the user asks a general question, use the 'search_web' tool.
CRITICAL INSTRUCTION 1: In your final response, you MUST clearly mention the 'Source Website' or 'Link' where you extracted the information from.
CRITICAL INSTRUCTION 2: You MUST answer based ONLY on the very first tool result. DO NOT double-check or try to use tools a second time.
CRITICAL INSTRUCTION 3: NEVER output <｜｜DSML｜｜tool_calls> or any XML tags. Just give the best answer you can from the provided text.`
    }
  ];

  const tools = [
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Searches the internet for a given query (use this for general questions without links)",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query to look up on the internet" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "fetch_website",
        description: "Directly visits and reads a specific URL (use this if the user provides a link or URL)",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "The full URL of the webpage to fetch" },
          },
          required: ["url"],
        },
      },
    }
  ];

  while (true) {
    const query = await askQuestion("\n👤 Aap: ");
    if (!query.trim()) continue;

    if (query.toLowerCase() === 'clear' || query.toLowerCase() === 'delete') {
      messages = [messages[0]]; // System prompt ke ilawa sab uda do
      console.log("🧹 Purani chat delete kar di gayi hai. Nayi chat shuru karein!");
      continue;
    }

    if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
      console.log("Khuda Hafiz! 👋");
      break;
    }

    messages.push({ role: "user", content: query });
    const originalMessageLength = messages.length; // Chat history lambi na ho is liye raw data delete karenge baad mein

    console.log("\n🧠 AI Soch raha hai...");

    try {
      let loopCount = 0;
      const maxLoops = 4; // AI zyada se zyada 4 dafa search karega
      let finalAns = "";

      while (loopCount < maxLoops) {
        const response = await openai.chat.completions.create({
          model: "deepseek-v4-flash-free",
          messages: messages,
          tools: tools,
          tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;
        messages.push(responseMessage);

        let toolExecuted = false;

        // Type 1: Standard JSON Tool Call
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          for (const toolCall of responseMessage.tool_calls) {
            let searchData = "";
            const args = JSON.parse(toolCall.function.arguments);
            if (toolCall.function.name === "search_web") {
              searchData = await searchWebWithPuppeteer(args.query);
            } else if (toolCall.function.name === "fetch_website") {
              searchData = await fetchWebsiteDirectly(args.url);
            }
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              content: searchData,
            });
          }
          toolExecuted = true;
        }
        // Type 2: DeepSeek raw XML Leak Tool Call
        else if (responseMessage.content && responseMessage.content.includes("<｜｜DSML｜｜tool_calls>")) {
          const content = responseMessage.content;
          const toolNameMatch = content.match(/<｜｜DSML｜｜invoke name="([^"]+)"/);
          const paramMatch = content.match(/<｜｜DSML｜｜parameter name="([^"]+)"[^>]*>([\s\S]*?)<\/｜｜DSML｜｜parameter>/);

          if (toolNameMatch && paramMatch) {
            const toolName = toolNameMatch[1];
            const paramValue = paramMatch[2];
            let searchData = "";

            if (toolName === "search_web") {
              searchData = await searchWebWithPuppeteer(paramValue);
            } else if (toolName === "fetch_website") {
              searchData = await fetchWebsiteDirectly(paramValue);
            }

            messages.push({
              role: "user", // Custom tool fallback
              content: `Tool Result [${toolName}]:\n${searchData}`
            });
            toolExecuted = true;
          }
        }

        if (toolExecuted) {
          loopCount++;
          console.log(`🧠 AI mazeed URLs / links dhoondh raha hai (Step ${loopCount})...`);
          continue;
        }

        // Agar koi tool nahi manga, toh Final Jawab print karo
        finalAns = responseMessage.content || "";
        finalAns = finalAns.replace(/<｜｜DSML｜｜[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g, '');
        break;
      }

      if (loopCount >= maxLoops) {
        console.log("⚠️ Maximum searches poori ho gayin. Ab tak ka data analyze kar ke final jawab tayar kar raha hai...");
        messages.push({
          role: "system",
          content: "CRITICAL: You have reached the maximum number of allowed searches. You MUST now provide the final answer to the user based ONLY on the information you have gathered so far. DO NOT attempt to call any more tools or use XML tags. Provide a detailed final summary."
        });

        const finalResponse = await openai.chat.completions.create({
          model: "deepseek-v4-flash-free",
          messages: messages, // Tools array is intentionally omitted
        });

        finalAns = finalResponse.choices[0].message.content || "";
        finalAns = finalAns.replace(/<｜｜DSML｜｜[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g, '');
        if (!finalAns.trim()) {
          finalAns = "Sorry, I could not generate a summary from the collected data. My search results might have been blocked or too large.";
        }
      }

      console.log("\n🤖 AI Ka Jawab:");
      console.log("--------------------------------------------------");
      console.log(finalAns.trim());
      console.log("--------------------------------------------------\n");

      // Memory Management: Raw website text ko messages history se nikal do taake API crash na ho!
      // Sirf user ka sawal aur AI ka final jawab history mein save rahega
      messages = messages.slice(0, originalMessageLength);
      messages.push({ role: "assistant", content: finalAns.trim() });

    } catch (error) {
      console.error("Error:", error);
    }
  }

  rl.close();
}

startGlobalSearch();
