#!/usr/bin/env bun
/**
 * Minimal MCP server that exposes a single tool: `wait_for_input`.
 * The tool blocks for a configurable number of seconds before responding.
 * Used to test how long Claude Code will wait for an MCP tool response.
 *
 * Usage:
 *   # Register the MCP server (stdio transport, local scope)
 *   claude mcp add --scope local timeout-test -- bun apps/spectator/test/timeout-mcp.ts
 *
 *   # Then ask Claude: "call the wait_for_input tool with seconds=30"
 *   # Observe whether it times out.
 *
 *   # Remove when done:
 *   claude mcp remove timeout-test
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "timeout-test", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "wait_for_input",
      description:
        "Waits for the specified number of seconds before responding. " +
        "Used to test MCP timeout behavior. Try 30, 60, 120, 300 seconds.",
      inputSchema: {
        type: "object" as const,
        properties: {
          seconds: {
            type: "number",
            description: "How many seconds to wait before responding",
            default: 30,
          },
        },
        required: ["seconds"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "wait_for_input") {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }

  const seconds = (request.params.arguments?.seconds as number) ?? 30;
  const startTime = new Date().toISOString();

  console.error(`[timeout-test] Waiting ${seconds}s... (started at ${startTime})`);

  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

  const endTime = new Date().toISOString();
  console.error(`[timeout-test] Done waiting. (ended at ${endTime})`);

  return {
    content: [
      {
        type: "text",
        text: `Waited ${seconds} seconds successfully.\nStarted: ${startTime}\nEnded: ${endTime}`,
      },
    ],
  };
});

// Start
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[timeout-test] MCP server running on stdio");
