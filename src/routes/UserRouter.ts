// routes/userRoutes.js
import express from "express";
import { getUserData } from "../controllers/userController.js";

const router = express.Router();

router.get("/users", getUserData);

export default router;
