// controllers/userController.js
import { Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { login, getCookie } from "../utils/auth.js";

const BASE_URL = "https://challenge.sunvoy.com";
const EMAIL = "demo@example.org";

export async function fetchUsers() {
  const res = await axios.post(
    `${BASE_URL}/api/users`,
    {},
    {
      headers: { Cookie: getCookie() },
    }
  );
  return res.data;
}

export async function fetchCurrentUser() {}

export async function getUserData(req: Request, res: Response): Promise<void> {
  try {
    if (!getCookie()) {
      await login();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
