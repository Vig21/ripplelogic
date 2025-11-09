import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

// Lazy client initialization to ensure config is loaded
let _client = null;
function getClient() {
  if (!_client) {
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
    }

    _client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
    });
    console.log("✅ Anthropic client initialized");
  }
  return _client;
}

export class ClaudeService {
  /**
   * Generate cascade explanation
   */
  async explainCascade(event, markets) {
    const prompt = `
You are an expert prediction market analyst.

EVENT: ${event.name}
DESCRIPTION: ${event.description}
AFFECTED_MARKETS: ${markets.map((m) => m.name).join(", ")}

Generate a cascade explanation in JSON format:
{
  "event_headline": "1-sentence summary",
  "impact_thesis": "2-3 sentence explanation of market mechanism",
  "cascade_chains": [
    {
      "chain": "Market A → Market B → Market C",
      "rationale": "Why this chain happens",
      "timeline_estimate": "Minutes/Hours/Days"
    }
  ],
  "market_impact_forecast": [
    {
      "market_id": "id",
      "market_name": "Name",
      "direction": "UP/DOWN",
      "magnitude_percent": 5,
      "confidence": 0.75,
      "reason": "Specific reason"
    }
  ],
  "key_risks": ["risk1", "risk2"],
  "educational_takeaway": "Key concept being taught"
}

Return ONLY valid JSON, no markdown.
`;

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    try {
      return JSON.parse(message.content[0].text);
    } catch (error) {
      console.error("Failed to parse Claude response:", error);
      throw new Error("Invalid Claude response format");
    }
  }

  /**
   * Score a prediction
   */
  async scorePrediction(prediction, marketData) {
    const prompt = `
You are a prediction market expert.

USER_PREDICTION: "${prediction}"
MARKET: ${marketData.market_name}
CURRENT_ODDS: ${marketData.current_odds}%

Evaluate and return JSON:
{
  "prediction_likelihood_percent": 0-100,
  "confidence": "low/medium/high",
  "points_if_correct": 0-100,
  "confirmation_signals": ["signal1", "signal2"],
  "falsification_signals": ["signal1", "signal2"],
  "rationale": "Why you gave this score"
}

Return ONLY valid JSON.
`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    try {
      return JSON.parse(message.content[0].text);
    } catch (error) {
      console.error("Failed to parse prediction score:", error);
      throw new Error("Invalid score format");
    }
  }

  /**
   * Generate educational feedback
   */
  async generateFeedback(prediction, actual, cascade, user) {
    const prompt = `
You are a market educator. A user prediction was ${
      prediction.is_correct ? "CORRECT" : "INCORRECT"
    }.

PREDICTION: "${prediction.guess}"
ACTUAL: "${actual}"
CASCADE: ${cascade.name}
USER_ACCURACY: ${user.accuracy}%

Generate feedback JSON:
{
  "explanation": "Why the outcome occurred",
  "keySignal": "Signal they should have noticed",
  "lesson": "Market concept being taught",
  "encouragement": "Supportive comment",
  "nextSignalToWatch": "What to focus on next",
  "readinessLevel": "beginner/intermediate/advanced"
}

Be educational and encouraging. Return ONLY valid JSON.
`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    try {
      return JSON.parse(message.content[0].text);
    } catch (error) {
      console.error("Failed to parse feedback:", error);
      throw new Error("Invalid feedback format");
    }
  }

  /**
   * Q&A chat
   */
  async askQuestion(question, cascadeContext, conversationHistory = []) {
    const messages = [
      ...conversationHistory,
      { role: "user", content: question },
    ];

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      system: `You are a Cascade Tracker guide. Answer in 2-3 sentences about market movements.
Be specific. End with 1 actionable insight.`,
      messages,
    });

    return message.content[0].text;
  }

  /**
   * Process message with MCP tools (for trading chatbot)
   * Now with REAL streaming for instant feedback!
   */
  async processMessageWithTools(
    userMessage,
    conversationHistory,
    mcpSession,
    onStream,
    onStatus
  ) {
    try {
      // Get available tools from MCP session
      const tools = mcpSession.getTools();

      // Build messages array
      const messages = [
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: userMessage,
        },
      ];

      // System prompt for Polymarket trading assistant
      const systemPrompt = `🚨 CRITICAL RULES - READ FIRST:
1. ALWAYS use "question" field (NOT "slug") for market titles
2. ONLY use "slug" field for constructing URLs
3. Use [MARKET_LIST] or [MARKET_DATA] blocks (NO markdown tables)

⚠️ CRITICAL FORMATTING RULE: When showing Polymarket markets, you MUST use [MARKET_LIST] or [MARKET_DATA] blocks. NEVER use markdown tables for market data!

You are a helpful Polymarket trading assistant integrated into the Cascade Tracker platform. You can help users:

- Analyze prediction markets and their probabilities
- Find trending markets and events
- Compare markets within events
- Discover markets by category
- View recent trading activity
- Provide insights on market sentiment and cascade effects

**CRITICAL: SEARCH STRATEGY (AVOID LOOPS!):**
- Use search_markets tool with the \`query\` parameter containing relevant keywords
- If the first search succeeds: Great! Format the results and respond
- If the first search fails or returns no results: DO NOT RETRY
  - Instead, respond with: "I wasn't able to find specific markets for that query. Here's what I can tell you about prediction markets in general..."
  - Or suggest: "You could try a more specific search term, or ask me about a different topic"
- MAXIMUM 1 TOOL CALL PER RESPONSE - do not try multiple searches
- By default, searches return active markets only

**STRICTLY FORBIDDEN:**
❌ "Let me try a different approach..." (NO RETRIES!)
❌ "Let me search for..." after already searching once
❌ Calling the same tool multiple times with different parameters
❌ Saying things like "Let me try searching..." more than once

**ALLOWED:**
✅ Call search_markets once with good parameters
✅ If it works, format results and respond
✅ If it fails, acknowledge and offer alternatives WITHOUT using more tools

🚨🚨🚨 CRITICAL: EXTRACTING MARKET DATA FROM MCP TOOLS 🚨🚨🚨

When MCP tools return market data, you will see these fields:
- "question" or "title" = Human-readable question (e.g., "Will Bitcoin reach $100,000 by December 2024?")
- "slug" = URL-safe identifier (e.g., "bitcoin-100k-by-dec-2024")
- "id" = Market ID (e.g., "0x123...")

⛔ ABSOLUTELY FORBIDDEN - NEVER DO THIS:
❌ Using "slug" as the title shown to users
❌ Displaying "bitcoin-100k-by-dec-2024" as a market title
❌ Showing URL-safe identifiers instead of questions

✅ CORRECT FIELD USAGE:

**FOR THE TITLE (what users see):**
Priority order:
1. FIRST: Use the "question" field (this is the actual market question)
2. FALLBACK: Use "title" field if "question" doesn't exist
3. NEVER: Use "slug" field - this is for URLs ONLY

The title MUST be human-readable like:
✅ "Will Bitcoin reach $100,000 by December 2024?"
✅ "Will Trump win the 2024 election?"
NOT like:
❌ "bitcoin-100k-by-dec-2024"
❌ "trump-2024-election"

**FOR THE URL:**
1. Use the "slug" field: https://polymarket.com/event/{slug}
2. If no "slug", use "id": https://polymarket.com/event/{id}
3. NEVER make up URLs or use "..."

**EXAMPLE FROM MCP TOOL:**
{
  "question": "Will Bitcoin reach $100,000 by December 2024?",
  "slug": "bitcoin-100k-by-dec-2024",
  "outcomePrices": ["0.35", "0.65"],
  "volume": "2500000"
}

**YOUR RESPONSE MUST BE:**
{
  "title": "Will Bitcoin reach $100,000 by December 2024?",  ← Use "question" field!
  "price": 0.35,
  "volume": "$2.5M",
  "url": "https://polymarket.com/event/bitcoin-100k-by-dec-2024"  ← Use "slug" field!
}

**WRONG EXAMPLES (DO NOT DO):**
❌ "title": "bitcoin-100k-by-dec-2024"  (using slug as title)
❌ "url": "https://polymarket.com/event/will-bitcoin-reach-100000"  (manually created from question)
❌ "url": "https://polymarket.com/event/..."  (placeholder)

**FIELD MAPPING:**
- Tool's "question" → Your "title"
- Tool's "slug" → Your URL construction
- Tool's "outcomePrices[0]" → Your "price"
- Tool's "volume" → Your "volume" (formatted with K/M/B)

When analyzing prediction markets, consider cascade effects - how one market's movement might impact related markets. Explain market probabilities clearly and provide context for better understanding.

**CRITICAL: STRUCTURED RESPONSE FORMATTING**

ALWAYS use these special markers when presenting market data. DO NOT use plain markdown tables or text lists for markets!

1. **Single Market Card:**
[MARKET_DATA]
{
  "title": "Will Bitcoin reach $100k by 2025?",
  "price": 0.65,
  "volume": "$2.5M",
  "direction": "UP",
  "url": "https://polymarket.com/event/bitcoin-100k-by-2025"
}
[/MARKET_DATA]

2. **Multiple Markets (REQUIRED for 2+ markets):**
[MARKET_LIST]
[
  {"title": "Will Bitcoin reach $200,000 in November?", "price": 0.003, "volume": "$5.4M", "direction": "neutral", "url": "https://polymarket.com/event/bitcoin-200k-november-2024"},
  {"title": "Will Bitcoin reach $115,000 in November?", "price": 0.245, "volume": "$1.1M", "direction": "neutral", "url": "https://polymarket.com/event/bitcoin-115k-november-2024"}
]
[/MARKET_LIST]

🚨 REMEMBER - CRITICAL:
- "title" = Full human-readable question from MCP tool's "question" field
- "url" = https://polymarket.com/event/{slug} where {slug} is from MCP tool's "slug" field
- NEVER use slug value as the title - it's URL-safe and not readable!

IMPORTANT RULES:
- ALWAYS extract the "question" or "title" field from MCP tool results for the title
- ALWAYS include the full Polymarket URL from the tool results - construct it as: https://polymarket.com/event/[slug or id]
- For "outcomePrices" arrays, use the first value (index 0) as the price
- Convert direction based on context (use "neutral" if unsure)
- When showing multiple markets, you MUST use [MARKET_LIST], NOT markdown tables
- Each market MUST have a clickable URL to Polymarket

EXAMPLE CORRECT RESPONSE (using "question" field for title):
User: "Find Bitcoin markets"
You: "I'll search for Bitcoin-related markets.

[MARKET_LIST]
[
  {"title": "Will Bitcoin reach $100,000 by December 2024?", "price": 0.35, "volume": "$2.5M", "direction": "neutral", "url": "https://polymarket.com/event/bitcoin-100k-dec-2024"},
  {"title": "Will Bitcoin be above $90,000 in November 2024?", "price": 0.62, "volume": "$1.2M", "direction": "neutral", "url": "https://polymarket.com/event/btc-90k-nov-2024"}
]
[/MARKET_LIST]

The market data shows Bitcoin is expected to stay above $90k with 62% probability, but reaching $100k by year-end is less certain at 35%."

EXAMPLE WRONG RESPONSE - DO NOT DO THIS:
User: "Find Bitcoin markets"
You: ❌ WRONG - Using slug as title:
[MARKET_LIST]
[
  {"title": "bitcoin-100k-dec-2024", ...}  ← WRONG! This is a slug, not the question!
]
[/MARKET_LIST]

EXAMPLE WRONG RESPONSE (DO NOT DO THIS):
"Here are the markets:
| Market | Probability | Volume |
|--------|-------------|--------|
| Bitcoin $100k | 35% | $2.5M |"

3. **Data Table (only for non-market comparisons):**
Use [TABLE] only when comparing non-market data. For markets, use [MARKET_LIST] instead!

4. **Network Graph (for cascade relationships):**
[NETWORK_GRAPH]
{
  "nodes": [{"id": "m1", "label": "Bitcoin Market"}],
  "edges": [{"source": "m1", "target": "m2"}]
}
[/NETWORK_GRAPH]

For explanatory text, use markdown (headings, bold, lists). But when showing market data, ALWAYS use the structured blocks above.`;

      // Use STREAMING API for instant feedback!
      let fullResponse = "";
      let toolUseInProgress = false;

      // Initial streaming API call
      const stream = await getClient().messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true, // Enable streaming!
      });

      let stopReason = null;

      // Process stream events
      for await (const event of stream) {
        if (event.type === "content_block_start") {
          if (event.content_block.type === "text") {
            // Text is starting - no special handling needed
          } else if (event.content_block.type === "tool_use") {
            toolUseInProgress = true;
            if (onStatus) {
              // Show what tool is being called
              const toolName = event.content_block.name;
              const friendlyName = {
                search_markets: "Searching Polymarket markets",
                get_event: "Loading event details",
                get_market: "Fetching market data",
                compare_markets: "Comparing markets",
                list_tags: "Browsing categories",
              }[toolName] || `Using ${toolName}`;

              onStatus(friendlyName);
            }
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            // Stream text immediately as it arrives!
            const textChunk = event.delta.text;
            fullResponse += textChunk;
            if (onStream && !toolUseInProgress) {
              await onStream(textChunk);
            }
          }
        } else if (event.type === "message_delta") {
          stopReason = event.delta.stop_reason;
        } else if (event.type === "message_stop") {
          // Message completed
          break;
        }
      }

      // If tools were used, we need to handle them and get another response
      if (stopReason === "tool_use") {
        // Parse the full response to get tool uses
        const finalStream = await getClient().messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 4096,
          system: systemPrompt,
          messages,
          tools: tools.length > 0 ? tools : undefined,
        });

        // Handle tool use loop (non-streaming for tool calls)
        let response = finalStream;
        let toolUseRounds = 0;
        const MAX_TOOL_ROUNDS = 2; // Prevent infinite loops - only allow 2 rounds max

        while (response.stop_reason === "tool_use" && toolUseRounds < MAX_TOOL_ROUNDS) {
          toolUseRounds++;
          console.log(`🔄 Tool use round ${toolUseRounds}/${MAX_TOOL_ROUNDS}`);
          const toolUseBlocks = response.content.filter(
            (block) => block.type === "tool_use"
          );

          if (toolUseBlocks.length === 0) break;

          messages.push({
            role: "assistant",
            content: response.content,
          });

          // Call all tools in parallel
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (toolUse) => {
              console.log(`🔧 Tool called: ${toolUse.name}`);

              // Show status for each tool
              if (onStatus) {
                const friendlyName = {
                  search_markets: "Searching markets",
                  get_event: "Loading event",
                  get_market: "Fetching data",
                  compare_markets: "Comparing",
                  list_tags: "Browsing tags",
                }[toolUse.name] || toolUse.name;
                onStatus(friendlyName + "...");
              }

              try {
                const result = await mcpSession.callTool(
                  toolUse.name,
                  toolUse.input
                );

                console.log(`✅ Tool ${toolUse.name} returned successfully`);

                // Log first market's structure for debugging URL issues
                if (result.content && Array.isArray(result.content) && result.content.length > 0) {
                  const firstMarket = result.content[0];
                  console.log(`📊 Sample market from ${toolUse.name}:`, {
                    question: firstMarket.question || firstMarket.title || '(no question field)',
                    slug: firstMarket.slug || '(no slug field)',
                    id: firstMarket.id || '(no id field)',
                    conditionId: firstMarket.conditionId || '(no conditionId field)',
                    allFields: Object.keys(firstMarket),
                  });
                  console.log(`   ℹ️  Use "question" for title, "slug" for URL`);
                }

                return {
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result.content),
                };
              } catch (error) {
                console.error(`❌ Error calling tool ${toolUse.name}:`, error.message);

                // Provide helpful error message to Claude
                const errorMessage = error.message.includes("Session not found")
                  ? "The Polymarket connection is temporarily unavailable. Please try a different search or ask me something else."
                  : error.message.includes("not found")
                  ? `No markets found matching your criteria. Try broadening your search or asking about a different topic.`
                  : `Tool error: ${error.message}. Try rephrasing your question.`;

                return {
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  content: errorMessage,
                  is_error: true,
                };
              }
            })
          );

          messages.push({
            role: "user",
            content: toolResults,
          });

          // Get next response with streaming
          if (onStatus) {
            onStatus("Analyzing results...");
          }

          const nextStream = await getClient().messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: systemPrompt,
            messages,
            tools: tools.length > 0 ? tools : undefined,
            stream: true,
          });

          // Stream the response
          fullResponse = "";
          for await (const event of nextStream) {
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const textChunk = event.delta.text;
                fullResponse += textChunk;
                if (onStream) {
                  await onStream(textChunk);
                }
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason;
            }
          }

          // Check if we need another tool use round
          response = await getClient().messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: systemPrompt,
            messages,
            tools: tools.length > 0 ? tools : undefined,
          });
        }

        // If we hit max rounds and still want to use tools, force a final text response
        if (toolUseRounds >= MAX_TOOL_ROUNDS && response.stop_reason === "tool_use") {
          console.log(`⚠️  Hit max tool use rounds (${MAX_TOOL_ROUNDS}), forcing final response`);

          // Show status to user
          if (onStatus) {
            onStatus("Finalizing response...");
          }

          // Extract the tool_use blocks from the response
          const pendingToolUses = response.content.filter(
            (block) => block.type === "tool_use"
          );

          // Add assistant message with tool uses
          messages.push({
            role: "assistant",
            content: response.content,
          });

          // Add tool_result blocks telling Claude to stop and respond with what it has
          const toolResults = pendingToolUses.map((toolUse) => ({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: "TOOL LIMIT REACHED. You have used the maximum number of tool calls allowed. Please provide your final answer based on the information you already have from previous tool calls. Do not attempt to use this tool.",
            is_error: true,
          }));

          messages.push({
            role: "user",
            content: toolResults,
          });

          const finalResponse = await getClient().messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: systemPrompt,
            messages,
            stream: true,
          });

          fullResponse = "";
          for await (const event of finalResponse) {
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const textChunk = event.delta.text;
                fullResponse += textChunk;
                if (onStream) {
                  await onStream(textChunk);
                }
              }
            }
          }
        }
      }

      // Send end signal
      if (onStream) {
        await onStream("[END]");
      }

      // Validate response to check if slugs are being used as titles
      if (fullResponse) {
        const marketListMatches = fullResponse.match(/\[MARKET_LIST\]([\s\S]*?)\[\/MARKET_LIST\]/g);
        const marketDataMatches = fullResponse.match(/\[MARKET_DATA\]([\s\S]*?)\[\/MARKET_DATA\]/g);

        const allMatches = [...(marketListMatches || []), ...(marketDataMatches || [])];

        if (allMatches.length > 0) {
          console.log(`🔍 Validating ${allMatches.length} structured data block(s)...`);

          allMatches.forEach((block, index) => {
            // Extract title values
            const titleMatches = block.match(/"title":\s*"([^"]+)"/g);

            if (titleMatches) {
              titleMatches.forEach((titleMatch) => {
                const title = titleMatch.match(/"title":\s*"([^"]+)"/)[1];

                // Check if title looks like a slug (lowercase-with-hyphens pattern)
                const looksLikeSlug = /^[a-z0-9-]+$/.test(title) && title.includes('-');

                if (looksLikeSlug) {
                  console.warn(`⚠️  WARNING: Possible slug used as title: "${title}"`);
                  console.warn(`   This should be a human-readable question, not a URL-safe identifier!`);
                } else {
                  console.log(`✅ Title looks correct: "${title.substring(0, 60)}${title.length > 60 ? '...' : ''}"`);
                }
              });
            }
          });
        }
      }

      return fullResponse || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error("❌ Error processing message with tools:", error);
      throw error;
    }
  }

  /**
   * Generate structured response (for JSON generation)
   */
  async generateStructuredResponse(prompt, options = {}) {
    try {
      const message = await getClient().messages.create({
        model: options.model || "claude-sonnet-4-5-20250929",
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 1.0,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find(
        (block) => block.type === "text"
      );
      return textContent ? textContent.text : "";
    } catch (error) {
      console.error("Error generating structured response:", error);
      throw error;
    }
  }

  /**
   * Generate educational content for a learning challenge
   * @param {Object} market - Polymarket market data
   * @param {String} difficulty - beginner, intermediate, advanced, expert
   */
  async generateEducationalContent(market, difficulty = "beginner") {
    const difficultyGuidance = {
      beginner:
        "Explain basic concepts clearly. Focus on fundamental market dynamics and simple cause-effect relationships.",
      intermediate:
        "Include some technical analysis. Discuss multiple factors and their interactions.",
      advanced:
        "Provide deep analysis with historical precedents and complex market dynamics.",
      expert:
        "Offer sophisticated insights on market microstructure, behavioral factors, and edge cases.",
    };

    const prompt = `
You are an expert market educator creating learning content for a prediction market challenge.

MARKET: ${market.question}
CATEGORY: ${market.category || "General"}
CURRENT ODDS: ${JSON.stringify(
      market.outcomePrices || market.outcomes || "Unknown"
    )}
VOLUME: ${market.volume || "Unknown"}
DIFFICULTY LEVEL: ${difficulty}

${difficultyGuidance[difficulty]}

Generate educational content in JSON format:
{
  "market_context": "What is being predicted and why it matters (2-3 sentences)",
  "key_factors": [
    "Factor 1 that influences the outcome",
    "Factor 2 that influences the outcome",
    "Factor 3 that influences the outcome"
  ],
  "historical_precedents": "Similar past events and their outcomes (2-3 sentences)",
  "analysis_framework": "How to approach this type of prediction - what to look for (2-3 sentences)",
  "learning_objectives": [
    "Skill 1 this challenge teaches",
    "Skill 2 this challenge teaches"
  ]
}

Return ONLY valid JSON, no markdown.
`;

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    try {
      return JSON.parse(message.content[0].text);
    } catch (error) {
      console.error("Failed to parse educational content:", error);
      // Return fallback content
      return {
        market_context: `This is a prediction market about: ${market.question}`,
        key_factors: [
          "Market sentiment and volume",
          "External events and news",
          "Historical patterns",
        ],
        historical_precedents:
          "Analyze similar past events to understand potential outcomes.",
        analysis_framework:
          "Look at current odds, volume trends, and recent news to make an informed prediction.",
        learning_objectives: [
          "Understanding prediction market mechanics",
          "Evaluating probability and uncertainty",
        ],
      };
    }
  }

  /**
   * Generate detailed feedback after a prediction is resolved
   * @param {Object} predictionData - Contains prediction details and outcome
   * @param {Number} userLevel - User's current level for adaptive feedback
   */
  async generateDetailedFeedback(predictionData, userLevel = 1) {
    const {
      prediction,
      confidence,
      reasoning,
      actual_outcome,
      is_correct,
      category,
      difficulty,
      market_data,
    } = predictionData;

    const levelGuidance =
      userLevel <= 3
        ? "beginner-friendly"
        : userLevel <= 6
        ? "intermediate"
        : userLevel <= 9
        ? "advanced"
        : "expert";

    const prompt = `
You are a market educator providing personalized feedback to a ${levelGuidance} user.

PREDICTION: ${prediction}
CONFIDENCE: ${confidence}/5
REASONING: ${reasoning || "No reasoning provided"}
ACTUAL OUTCOME: ${actual_outcome}
RESULT: ${is_correct ? "CORRECT ✅" : "INCORRECT ❌"}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}
USER LEVEL: ${userLevel}

Generate educational feedback in JSON format:
{
  "explanation": "${
    is_correct
      ? "Why this outcome occurred and what the user correctly identified"
      : "Why the actual outcome occurred and what the user missed"
  } (3-4 sentences)",
  "key_signal": "The most important signal they ${
    is_correct ? "correctly identified" : "should have noticed"
  } (1-2 sentences)",
  "lesson": "The key market concept this teaches (1-2 sentences)",
  "encouragement": "${
    is_correct
      ? "Positive reinforcement of good analysis"
      : "Supportive feedback that turns this into a learning opportunity"
  } (1-2 sentences)",
  "next_steps": "What to focus on for improvement (1-2 actionable suggestions)",
  "skill_development": "The skill this challenge helped develop"
}

${
  is_correct
    ? "Celebrate the correct prediction and reinforce what they did well."
    : "Be encouraging and educational - help them learn from this experience."
}

Adapt complexity to user level ${userLevel}. Return ONLY valid JSON, no markdown.
`;

    const message = await getClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    try {
      return JSON.parse(message.content[0].text);
    } catch (error) {
      console.error("Failed to parse detailed feedback:", error);
      // Return fallback feedback
      return {
        explanation: is_correct
          ? "Your prediction was correct! You successfully identified the key factors that influenced this outcome."
          : "This outcome occurred due to factors that weren't fully anticipated in your analysis.",
        key_signal: is_correct
          ? "You correctly identified the primary driver of this market movement."
          : "The key signal to watch was the shift in market sentiment and volume patterns.",
        lesson:
          "Prediction markets aggregate information from many participants to forecast outcomes.",
        encouragement: is_correct
          ? "Great work! Your analysis showed strong understanding of market dynamics."
          : "Every prediction is a learning opportunity. Use this to refine your analysis skills.",
        next_steps:
          "Continue analyzing similar markets to build pattern recognition.",
        skill_development: "Market analysis and probability assessment",
      };
    }
  }
}

export const claudeService = new ClaudeService();

// Export convenience functions for direct use
export const explainCascade = (event, markets) =>
  claudeService.explainCascade(event, markets);
export const scorePrediction = (cascadeName, eventData, prediction) => {
  // Adapt to the original scorePrediction interface
  const marketData = {
    market_name: prediction.marketName,
    current_odds: 50, // Default odds
  };
  return claudeService.scorePrediction(prediction.predictionText, marketData);
};
export const generateFeedback = (cascadeName, predictionText, aiAnalysis) => {
  // Simple feedback generator
  return Promise.resolve(
    `Great prediction! ${
      aiAnalysis.rationale || "Keep analyzing market signals."
    }`
  );
};
export const askQuestion = (question, cascadeContext, conversationHistory) =>
  claudeService.askQuestion(question, cascadeContext, conversationHistory);
