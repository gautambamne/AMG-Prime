import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "amg-prime-firebase-adminsdk-fbsvc-25249d1c3a.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/content", async (req, res) => {
    try {
      const db = admin.firestore();
      const videosSnapshot = await db.collection("videos").orderBy("createdAt", "desc").limit(20).get();
      const magazinesSnapshot = await db.collection("magazines").orderBy("createdAt", "desc").limit(10).get();
      const eventsSnapshot = await db.collection("events").orderBy("createdAt", "desc").limit(5).get();

      res.json({
        videos: videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        magazines: magazinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        events: eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/admin/broadcast", async (req, res) => {
    const { title, body, topic } = req.body;
    try {
      const message = {
        notification: { title, body },
        topic: topic || "all"
      };
      await admin.messaging().send(message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

