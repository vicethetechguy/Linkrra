import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import * as eventsource from "eventsource";

const EventSource = eventsource.default || eventsource;
if (!global.EventSource) {
  global.EventSource = EventSource;
}

// polyfill fetch
import fs from 'fs';

async function main() {
  const apiKey = "AQ.Ab8RN6K8LqIm2FYdxWq5JU0BhE_Vwf9IzTEaU7sxwGXZFCbocw";
  
  const transport = new SSEClientTransport(
    new URL("https://stitch.googleais.com/mcp/"),
    {
      headers: {
        "X-Google-Api-key": apiKey,
        "Accept": "text/event-stream"
      }
    }
  );

  const client = new Client(
    { name: "antigravity-script", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  try {
    await client.connect(transport);
    const toolsResult = await client.listTools();
    
    let out = "Available tools:\n";
    out += JSON.stringify(toolsResult.tools, null, 2) + "\n\n";

    // Call the tool to get the screen details if a relevant tool exists
    const tool = toolsResult.tools.find(t => t.name.includes("screen") || t.name.includes("project"));
    if (tool) {
       out += `Calling tool ${tool.name}...\n`;
       // Depending on what tools are available, we pass the project ID and screen ID.
       // The prompt says Project ID: 15315311553873023738, Screen ID: a43d2bc3b92340568ae86e61d14b33e2
       const args = {};
       if (tool.inputSchema.properties.projectId) args.projectId = "15315311553873023738";
       if (tool.inputSchema.properties.screenId) args.screenId = "a43d2bc3b92340568ae86e61d14b33e2";
       
       if (Object.keys(args).length > 0) {
           const result = await client.callTool({ name: tool.name, arguments: args });
           out += JSON.stringify(result, null, 2);
       }
    }

    fs.writeFileSync('stitch_out2.txt', out);
    console.log("Written to stitch_out2.txt");
    await transport.close();
  } catch (err) {
    fs.writeFileSync('stitch_out2.txt', "Error: " + err.message + "\n" + err.stack);
    console.log("Error written to stitch_out2.txt");
  }
}

main();
