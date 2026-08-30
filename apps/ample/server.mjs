import express from "express";

const app = express();
const port = process.env.PORT || 8080;
const memory = [];

app.use(express.json());
app.use(express.static("web"));

app.get("/api/memory", (_req, res) => {
  res.json({ ok: true, entries: memory });
});

app.post("/api/memory", (req, res) => {
  const entry = {
    id: String(Date.now()),
    title: String(req.body?.title || "Saved entry"),
    body: String(req.body?.body || ""),
    createdAt: new Date().toISOString(),
  };
  memory.unshift(entry);
  res.status(201).json({ ok: true, entry });
});

app.listen(port, () => console.log("listening on " + port));
