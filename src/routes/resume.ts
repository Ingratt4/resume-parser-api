import express from "express";
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "uploads/" });
import { parseResume } from "../services/parser";

router.post("/", upload.single("resume"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const parsedResume = await parseResume(req.file);
    res.json(parsedResume);
  } catch (err) {
    console.error("Error parsing resume:", err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

export default router;
