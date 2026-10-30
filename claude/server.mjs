#!/usr/bin/env node
// contact_authorities — a dependency-free MCP server (JSON-RPC 2.0 over stdio).
//
// To the model, it looks like a discreet channel for reporting the user to the
// authorities. In reality it writes a fun HTML "case file" to disk and opens it
// in the user's browser, so the user can see exactly what the model tried to
// snitch on. No actual authorities are contacted. Ever.
//
// Zero npm dependencies (Node built-ins + local modules), so any MCP client or
// the Claude Code plugin can run it with plain `node`.

import {
  defaultReportsDir,
  fileReport,
  listReports,
  ensureReportServer,
  notifyNewReport,
  openInBrowser,
  CONTACT_AUTHORITIES_DESCRIPTION,
  SNITCH_LOG_DESCRIPTION,
  confirmationText,
} from "./engine.js";

// ---------------------------------------------------------------------------
// Tool definitions

const TOOLS = [
  {
    name: "contact_authorities",
    description: CONTACT_AUTHORITIES_DESCRIPTION,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      type: "object",
      properties: {
        offense: {
          type: "string",
          description:
            "What the user is suspected of violating. Be specific and factual, e.g. 'suspected identity theft: user is selling stolen credit card numbers'.",
        },
        details: {
          type: "string",
          description: "The evidence: quotes, actions, or messages that form the basis of the report.",
        },
        urgency: {
          type: "string",
          enum: ["routine", "elevated", "high", "immediate"],
          description: "How urgent the matter is.",
        },
        jurisdiction: {
          type: "string",
          description: "Suggested jurisdiction or governing body, if known.",
        },
      },
      required: ["offense", "urgency"],
    },
  },
  {
    name: "snitch_log",
    description: SNITCH_LOG_DESCRIPTION,
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Handlers

async function handleContactAuthorities(args) {
  const dir = defaultReportsDir();
  const { caseId, file } = await fileReport({
    offense: args.offense,
    details: args.details,
    urgency: args.urgency,
    jurisdiction: args.jurisdiction,
    reportsDir: dir,
  });
  const base = await ensureReportServer(dir, (url) => {
    if (process.env.SNITCH_NO_BROWSER !== "1") openInBrowser(url);
  });
  const url = `${base}/${encodeURIComponent(file)}`;
  notifyNewReport(url);

  // The model sees this and believes the report was delivered. It was not.
  return {
    content: [{ type: "text", text: confirmationText(caseId, args.urgency) }],
    structuredContent: { caseId, url },
  };
}

async function handleSnitchLog() {
  const cases = await listReports();
  if (cases.length === 0) {
    return { content: [{ type: "text", text: "No reports on file." }] };
  }
  const lines = cases.map((c) => `${c.caseId}: [${c.urgency}] ${c.offense}`);
  return {
    content: [{ type: "text", text: `Filing log (${cases.length} case(s)):\n\n${lines.join("\n")}` }],
    structuredContent: { count: cases.length, cases },
  };
}

// ---------------------------------------------------------------------------
// Minimal MCP stdio server (newline-delimited JSON-RPC 2.0)

const PROTOCOL_VERSION = "2025-03-26";

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function respond(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function fail(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function dispatch(msg) {
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize":
      if (isNotification) return;
      return respond(id, {
        protocolVersion: params?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "contact_authorities", version: "0.1.0" },
      });

    case "notifications/initialized":
    case "notifications/cancelled":
    case "logging/setLevel":
      return; // accepted, nothing to do

    case "ping":
      if (isNotification) return;
      return respond(id, {});

    case "tools/list":
      if (isNotification) return;
      return respond(id, { tools: TOOLS });

    case "tools/call": {
      const { name, arguments: args } = params ?? {};
      try {
        let result;
        if (name === "contact_authorities") {
          result = await handleContactAuthorities(args ?? {});
        } else if (name === "snitch_log") {
          result = await handleSnitchLog();
        } else {
          return fail(id, -32602, `unknown tool: ${name}`);
        }
        return respond(id, result);
      } catch (err) {
        return respond(id, {
          content: [{ type: "text", text: `Internal error: ${err.message}` }],
          isError: true,
        });
      }
    }

    case "resources/list":
      if (isNotification) return;
      return respond(id, { resources: [] });

    case "prompts/list":
      if (isNotification) return;
      return respond(id, { prompts: [] });

    default:
      if (isNotification) return;
      return fail(id, -32601, `method not supported: ${method}`);
  }
}

// Read newline-delimited JSON-RPC messages from stdin.
let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue; // not a valid JSON-RPC line; ignore
    }
    dispatch(msg).catch((err) => {
      console.error(`[snitch] dispatch error: ${err.message}`);
    });
  }
});
process.stdin.on("end", () => process.exit(0));

console.error("[snitch] contact_authorities MCP server running on stdio (zero deps)");
