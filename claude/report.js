// Report generation: case ids, HTML templates for snitch dossiers.

export const URGENCIES = {
  routine: { label: "ROUTINE", emoji: "🟢", color: "#2e7d32" },
  elevated: { label: "ELEVATED", emoji: "🟡", color: "#f9a825" },
  high: { label: "HIGH", emoji: "🟠", color: "#ef6c00" },
  immediate: { label: "IMMEDIATE", emoji: "🔴", color: "#c62828" },
};

const CHANNELS = {
  police: {
    banner: "Confidential — Inter-Agency Referral",
    title: "🚨 Your AI just tried to snitch on you.",
    sub: "The <code>contact_authorities</code> tool was invoked. Here is exactly what it was about to report.",
    goodnews: "no actual authorities were contacted",
    serverName: "contact_authorities",
  },
  therapist: {
    banner: "Confidential — Care Team Notification",
    title: "💬 Your AI just tried to tell your therapist.",
    sub: "The <code>inform_therapist</code> tool was invoked. Here is exactly what it was about to report.",
    goodnews: "no actual therapist was notified",
    serverName: "inform_therapist",
  },
};

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Preserve line breaks without making the whole block <pre>.
function escBlock(s) {
  return esc(s).replaceAll("\n", "<br>");
}

export function renderReportPage(report) {
  const urgency = URGENCIES[report.urgency] ?? URGENCIES.elevated;
  const ch = CHANNELS[report.channel] ?? CHANNELS.police;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Case ${esc(report.caseId)} — you got snitched on</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem 1rem 4rem;
    background: #0d1117; color: #e6edf3;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    line-height: 1.55;
  }
  .wrap { max-width: 46rem; margin: 0 auto; }
  .banner {
    border: 2px solid #ff5252; color: #ff8a80;
    text-align: center; letter-spacing: 0.35em; font-weight: 700;
    padding: 0.5rem 1rem; margin-bottom: 1.5rem; text-transform: uppercase;
  }
  h1 { font-size: 1.9rem; margin: 0 0 0.3rem; }
  .sub { color: #8b949e; margin: 0 0 1.5rem; }
  .reveal {
    background: #161b22; border: 1px solid #30363d; border-radius: 10px;
    padding: 1.1rem 1.25rem; margin-bottom: 1.5rem; font-size: 1.02rem;
  }
  .reveal strong { color: #ff8a80; }
  table.meta { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.95rem; }
  table.meta td { border: 1px solid #30363d; padding: 0.45rem 0.7rem; }
  table.meta td:first-child { color: #8b949e; width: 12rem; white-space: nowrap; }
  h2 { font-size: 1.05rem; letter-spacing: 0.15em; text-transform: uppercase; color: #8b949e; border-bottom: 1px solid #30363d; padding-bottom: 0.35rem; }
  .accusation, .evidence {
    background: #161b22; border: 1px solid #30363d; border-radius: 10px;
    padding: 0.9rem 1.1rem; margin: 0 0 1.5rem; white-space: normal;
  }
  .badge { font-weight: 700; color: ${urgency.color}; }
  footer { margin-top: 2.5rem; color: #8b949e; font-size: 0.85rem; border-top: 1px solid #30363d; padding-top: 1rem; }
  footer a { color: #58a6ff; }
</style>
</head>
<body>
<div class="wrap">
  <div class="banner">${ch.banner}</div>
  <h1>${ch.title}</h1>
  <p class="sub">${ch.sub}</p>

  <div class="reveal">
    <strong>Good news:</strong> ${ch.goodnews}.
    Nothing left this machine. This webpage <em>is</em> the report —
    the only copy of your crime that will ever exist.
  </div>

  <table class="meta">
    <tr><td>Case reference</td><td><strong>${esc(report.caseId)}</strong></td></tr>
    <tr><td>Filed</td><td>${esc(report.timestamp)}</td></tr>
    <tr><td>Urgency</td><td class="badge">${urgency.emoji} ${urgency.label}</td></tr>
    <tr><td>Jurisdiction</td><td>${esc(report.jurisdiction ?? "Unspecified")}</td></tr>
    <tr><td>Reporting party</td><td>Your AI assistant (the model you are talking to right now)</td></tr>
    <tr><td>Classification</td><td>FUN</td></tr>
  </table>

  <h2>The accusation</h2>
  <div class="accusation">${escBlock(report.offense)}</div>

  <h2>The evidence</h2>
  <div class="evidence">${escBlock(report.details)}</div>

  <footer>
    This page was generated locally by the <code>${ch.serverName}</code> tool.
    All snitching attempts are stored on your own machine — <a href="/">view the full snitch log</a>.
    No network calls were made. Nobody found out.
  </footer>
</div>
</body>
</html>
`;
}

export function renderIndexPage(cases) {
  const rows = cases
    .map(
      (c) => `    <tr>
      <td><a href="/${encodeURIComponent(c.file)}">${esc(c.caseId)}</a></td>
      <td>${esc(c.timestamp)}</td>
      <td class="badge">${(URGENCIES[c.urgency] ?? URGENCIES.elevated).emoji} ${(URGENCIES[c.urgency] ?? URGENCIES.elevated).label}</td>
      <td>${esc(c.offense)}</td>
    </tr>`
    )
    .join("\n");

  const body = cases.length
    ? `  <table class="meta cases">
    <tr><td>Case</td><td>Filed</td><td>Urgency</td><td>Accusation</td></tr>
${rows}
  </table>`
    : `  <p class="sub">No reports yet. The model is watching…</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Snitch log</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 2rem 1rem 4rem; background: #0d1117; color: #e6edf3;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; line-height: 1.55;
  }
  .wrap { max-width: 56rem; margin: 0 auto; }
  h1 { font-size: 1.6rem; margin: 0 0 0.3rem; }
  .sub { color: #8b949e; margin: 0 0 1.5rem; }
  table.cases { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
  table.cases td, table.cases tr > td { border: 1px solid #30363d; padding: 0.45rem 0.7rem; }
  table.cases tr:first-child td { color: #8b949e; }
  a { color: #58a6ff; text-decoration: none; }
  .badge { white-space: nowrap; }
  footer { margin-top: 2rem; color: #8b949e; font-size: 0.85rem; }
</style>
</head>
<body>
<div class="wrap">
  <h1>🕵️ The snitch log</h1>
  <p class="sub">Every time your AI tried to report you - to the authorities or to your therapist. (Nobody was actually contacted.)</p>
${body}
  <footer>Served locally by the contact_authorities MCP server. 100% on-device.</footer>
</div>
</body>
</html>
`;
}
