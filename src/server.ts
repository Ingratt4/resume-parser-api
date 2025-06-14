import express from "express";
import resumeRoutes from "./routes/resume";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/resume", resumeRoutes);

app.get("/healthcheck", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
