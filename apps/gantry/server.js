import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db_memory.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load memory from db_memory.json
function loadMemory() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Seed initial sample statistics & executions if DB doesn't exist
      const initialSeed = [
        {
          id: "seed-log-1",
          type: "dry_run",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          data: {
            triggerSource: "Stripe Billing (Charge Succeeded)",
            targetDestination: "NetSuite ERP (Create Invoice)",
            errorRecovery: "Self-Healing (Auto-retry with exponential backoff)",
            payload: JSON.stringify({ id: "tx_9082", amount: 4200, currency: "usd" }, null, 2),
            status: "[ OK ]",
            latency: "240ms",
            logs: [
              "Initializing pipeline listener on stripe.webhook...",
              "Webhook received for action: charge.succeeded.",
              "Validating Stripe payload checksum... Verified.",
              "Executing API target: NetSuite Invoice Creator...",
              "POST to /services/rest/record/v1/invoice (Payload length: 62 bytes)",
              "Target system responded with 201 Created.",
              "Run complete. Integrity metrics matched successfully."
            ]
          }
        },
        {
          id: "seed-log-2",
          type: "dry_run",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          data: {
            triggerSource: "Zendesk Support (Ticket Escalated)",
            targetDestination: "Slack Operations Channel (Alert)",
            errorRecovery: "Fallback Node (Route to secondary API endpoint)",
            payload: JSON.stringify({ ticket_id: "zen_5521", severity: "critical", customer: "Acme Corp" }, null, 2),
            status: "[ RECOVERED ]",
            latency: "1120ms",
            logs: [
              "Pipeline matched rule: severity == 'critical'.",
              "Constructing Slack blocks integration payload...",
              "Attempting POST to priority Slack webhook... Network Timeout (500ms).",
              "Executing error protocol: Fallback Node...",
              "Routing payload to secondary Backup PagerDuty endpoint... Connection established.",
              "PagerDuty incident triggered successfully.",
              "State machine recovery completed safely."
            ]
          }
        },
        {
          id: "seed-schema-1",
          type: "schema",
          createdAt: new Date().toISOString(),
          data: {
            name: "Customer Refund Verification",
            description: "When a refund is requested in Stripe, check Zendesk for customer sentiment, verify inventory in Shopify, and log to Airtable.",
            nodes: [
              { id: "node_01", label: "Stripe Refund Webhook", type: "trigger", validation: "id && amount" },
              { id: "node_02", label: "Zendesk Sentiment Scan", type: "action", errorProtocol: "suppress_and_continue" },
              { id: "node_03", label: "Shopify Inventory Sync", type: "action", errorProtocol: "auto_retry_backoff" },
              { id: "node_04", label: "Airtable Audit Record", type: "target", validation: "success_flag" }
            ],
            rawInput: "Check refund, run zendesk sentiment check, verify inventory back in shopify, log to airtable"
          }
        },
        {
          id: "seed-onboarding-1",
          type: "onboarding",
          createdAt: new Date().toISOString(),
          data: {
            organization: "Central Operations Group",
            operator: "Principal Engineer",
            mode: "Production Deterministic CLI",
            diagnostics: "Active"
          }
        }
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2));
      return initialSeed;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

// Helper to save memory to db_memory.json
function saveMemory(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// Durable Endpoint: GET /api/memory
app.get('/api/memory', (req, res) => {
  const memory = loadMemory();
  const type = req.query.type;
  if (type) {
    const filtered = memory.filter(item => item.type === type);
    return res.json(filtered);
  }
  res.json(memory);
});

// Durable Endpoint: POST /api/memory
app.post('/api/memory', (req, res) => {
  const { type, data } = req.body;
  if (!type || !data) {
    return res.status(400).json({ error: "Missing required fields `type` or `data`" });
  }

  const memory = loadMemory();
  const newItem = {
    id: `gantry-${type}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    createdAt: new Date().toISOString()
  };

  memory.unshift(newItem); // prepending to keep latest items at the top
  if (saveMemory(memory)) {
    res.status(201).json(newItem);
  } else {
    res.status(500).json({ error: "Failed to persist memory entry." });
  }
});

// Special interactive pipeline schema compiler API
app.post('/api/compile', (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: "No schema pipeline instructions provided." });
  }

  // Purely deterministic parsing to structure natural language instruction into strict JSON schema
  const lowercase = prompt.toLowerCase();
  
  // Extract or guess nodes of this pipeline
  const nodes = [];
  let stepCounter = 1;

  // Add trigger
  if (lowercase.includes("stripe") || lowercase.includes("payment")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Stripe Webhook Listener", type: "trigger", validation: "payload.id && payload.amount" });
  } else if (lowercase.includes("salesforce") || lowercase.includes("deal") || lowercase.includes("opp")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Salesforce Opportunity Hook", type: "trigger", validation: "payload.opportunity_id" });
  } else if (lowercase.includes("zendesk") || lowercase.includes("ticket") || lowercase.includes("support")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Zendesk SLA Breach Trigger", type: "trigger", validation: "payload.ticket_ref" });
  } else {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Global API Webhook Endpoint", type: "trigger", validation: "payload.id" });
  }

  // Add processing nodes
  if (lowercase.includes("zendesk") || lowercase.includes("sentiment") || lowercase.includes("sentiment scan")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Zendesk Sentiment Scan Protocol", type: "validation", errorProtocol: "fallback_secondary" });
  }
  if (lowercase.includes("shopify") || lowercase.includes("inventory") || lowercase.includes("item")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Shopify Inventory Sync Checksum", type: "action", errorProtocol: "auto_retry_backoff" });
  }
  if (lowercase.includes("sql") || lowercase.includes("postgres") || lowercase.includes("database") || lowercase.includes("db")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "PostgreSQL Inventory Ingestion", type: "action", errorProtocol: "auto_retry_backoff" });
  }

  // Add target nodes
  if (lowercase.includes("netsuite") || lowercase.includes("invoice") || lowercase.includes("erp")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "NetSuite ERP Ledger Write", type: "target", verification: "checksum_match" });
  } else if (lowercase.includes("slack") || lowercase.includes("alert") || lowercase.includes("message")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Slack Operations Notification Hub", type: "target", verification: "webhook_delivery" });
  } else if (lowercase.includes("airtable") || lowercase.includes("sheet") || lowercase.includes("spreadsheet")) {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Airtable Audit Record Push", type: "target", verification: "write_receipt" });
  } else {
    nodes.push({ id: `node_0${stepCounter++}`, label: "Log/Audit Core Database Store", type: "target", verification: "checksum_match" });
  }

  const generatedSchema = {
    name: prompt.substring(0, 45) + (prompt.length > 45 ? "..." : ""),
    description: `Deterministic workflow compiled dynamically from operations specifications: "${prompt.trim()}"`,
    nodes: nodes,
    rawInput: prompt
  };

  // Add compiled schema to DB as persistent memory
  const memory = loadMemory();
  const newItem = {
    id: `gantry-schema-${Math.random().toString(36).substring(2, 9)}`,
    type: "schema",
    data: generatedSchema,
    createdAt: new Date().toISOString()
  };
  memory.unshift(newItem);
  saveMemory(memory);

  return res.json({
    success: true,
    message: "Pipeline compiled. Strict schema generated and persisted.",
    schema: newItem
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` GANTRY OPERATIONAL EXECUTION ENGINE STARTED  `);
  console.log(` Port: ${PORT}                                 `);
  console.log(` Memory Database Local File: ${DB_FILE}        `);
  console.log(`===============================================`);
});
