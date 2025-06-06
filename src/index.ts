import express from "express";
import { Request, Response } from "express";

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript + Express!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
