import readline from 'readline';

// IMPORTANT: Your Google AI Studio API Key
const GEMINI_API_KEY = "AIzaSyAXVknAov4xsEmwyqwPtI0_PqYm_bnoBKE";

if (GEMINI_API_KEY === "PLACEHOLDER_API_KEY" || !GEMINI_API_KEY) {
    console.error("❌ Please set your GEMINI_API_KEY in the script first.");
    process.exit(1);
}

// Setup interactive terminal reader
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-flash-latest",
    "gemini-pro-latest"
];

let currentModel = "gemini-2.5-flash";

// Store chat history to maintain conversation context (Native Gemini API format)
const chatHistory = [];

console.log("===================================================================");
console.log("\x1b[32m✨ Gemini Interactive Multi-Model Debugger is Ready! ✨\x1b[0m");
console.log(`Current Active Model: \x1b[33m${currentModel}\x1b[0m`);
console.log("Aap koi bhi sawal pooch sakte hain.");
console.log("\x1b[35mCommands:\x1b[0m");
console.log("  \x1b[35m/model\x1b[0m  ⟶ Change active model");
console.log("  \x1b[35m/exit\x1b[0m   ⟶ Close application");
console.log("===================================================================\n");

function promptUser() {
    rl.question(`\x1b[36m👤 User [${currentModel}]:\x1b[0m `, async (userInput) => {
        const query = userInput.trim();
        
        if (!query) {
            promptUser();
            return;
        }

        // Check for exit
        if (query.toLowerCase() === '/exit' || query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
            console.log("\n\x1b[33m👋 Allah Hafiz! Debugger band ho raha hai.\x1b[0m");
            rl.close();
            return;
        }

        // Check for /model selection command
        if (query.toLowerCase() === '/model' || query.toLowerCase() === 'model') {
            console.log("\n⚙️ \x1b[35mSelect a model by entering the number:\x1b[0m");
            MODELS.forEach((model, index) => {
                const activeMarker = model === currentModel ? " ⭐️ (Active)" : "";
                console.log(`  [${index + 1}] ${model}${activeMarker}`);
            });
            
            rl.question('\n👉 Enter choice number: ', (choice) => {
                const num = parseInt(choice.trim(), 10);
                if (num >= 1 && num <= MODELS.length) {
                    currentModel = MODELS[num - 1];
                    console.log(`\n✅ Active model switched to: \x1b[33m${currentModel}\x1b[0m\n`);
                } else {
                    console.log("\n❌ Invalid choice. Model not changed.\n");
                }
                promptUser();
            });
            return;
        }

        // Add user message to history
        chatHistory.push({
            role: "user",
            parts: [{ text: query }]
        });

        process.stdout.write(`\x1b[35m🔍 [${currentModel}] Google Search & Thinking...\x1b[0m\r`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: chatHistory,
                    systemInstruction: {
                        parts: [{ text: "You are a concise rates assistant. When asked about rates or prices of any asset, use Google Search to find the latest value, and reply ONLY with the current price/rate. Do not list sources, sites, or multiple exchanges unless explicitly asked. Example: 'Bitcoin (BTC) current price is $66,057 USD.' or 'Gold rate is $2,350 per ounce.'" }]
                    },
                    tools: [
                        {
                            google_search: {}
                        }
                    ]
                })
            });

            // Clear status line
            process.stdout.write("                                                                                    \r");

            const data = await response.json();

            if (!response.ok) {
                console.log(`\x1b[31m🖥️  [Model: ${currentModel}] - STATUS: FAILED\x1b[0m`);
                console.error(`❌ \x1b[31mError:\x1b[0m ${data.error?.message || "HTTP Error"}\n`);
                
                // Remove the last query from history since it failed
                chatHistory.pop();
            } else {
                const candidate = data.candidates?.[0];
                const reply = candidate?.content?.parts?.[0]?.text || "No reply received.";

                console.log(`\x1b[32m🖥️  [Model: ${currentModel}] - STATUS: SUCCESS\x1b[0m`);
                console.log(`🤖 \x1b[32mGemini:\x1b[0m ${reply}\n`);

                // Save reply to chat history
                chatHistory.push({
                    role: "model",
                    parts: [{ text: reply }]
                });
            }

        } catch (error) {
            process.stdout.write("                                                                                    \r");
            console.log(`\x1b[31m🖥️  [Model: ${currentModel}] - STATUS: FAILED\x1b[0m`);
            console.error(`❌ \x1b[31mError:\x1b[0m ${error.message}\n`);
            chatHistory.pop();
        }

        // Ask the next question
        promptUser();
    });
}

// Start the loop
promptUser();
