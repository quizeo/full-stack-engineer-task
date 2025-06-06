import express from "express";
import userRouter from "./routes/UserRouter.js";

const app = express();
const PORT = 3000;

app.use("/api", userRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
