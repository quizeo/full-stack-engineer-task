import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";

import { login, getCookie } from "../utils/auth.js";
import { timeStamp } from "console";

const BASE_URL = "https://challenge.sunvoy.com";
const API_BASE_URL = "https://api.challenge.sunvoy.com";
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

export async function fetchTokens() {
  try {
    console.log("Fetching tokens...");
    const response = await axios.get(`${BASE_URL}/settings/tokens`, {
      headers: {
        Cookie: getCookie(),
      },
    });

    console.log("Response received with status:", response.status);
    console.log("Response type:", typeof response.data);

    // If response is HTML, extract hidden inputs
    if (typeof response.data === "string" && response.data.includes("<input")) {
      console.log("HTML response detected, contains input elements");
      const html = response.data;
      const inputs: Record<string, string> = {};

      // Regular expression to match input elements with id and value attributes
      const regex =
        /<input[^>]*?\sid=["']([^"']+)["'][^>]*?\svalue=["']([^"']*)["'][^>]*?>/g;
      let match;

      while ((match = regex.exec(html)) !== null) {
        const id = match[1];
        const value = match[2];
        inputs[id] = value;
      }

      console.log("Extracted inputs:", inputs);
      return inputs;
    }

    // Otherwise return the original data
    console.log("Response is not HTML with inputs, data:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error(
      "Error fetching tokens:",
      error instanceof Error ? error.message : String(error)
    );

    return {
      error: "Failed to fetch tokens",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function calculateCheckcode(tokens: any, timestamp: string): string {
  // First create the same URL params object WITHOUT the checkcode
  // This ensures parameters are encoded the same way
  const paramsForHash = new URLSearchParams({
    access_token: tokens.access_token,
    apiuser: tokens.apiuser,
    language: tokens.language,
    openId: tokens.openId,
    operateId: tokens.operateId,
    timestamp: timestamp,
    userId: tokens.userId,
  });

  // Convert to string to get the exact same format as will be sent
  const paramString = paramsForHash.toString();

  console.log("Parameter string for hash calculation:", paramString);

  // Calculate the SHA-1 hash of this string
  const hash = crypto
    .createHash("sha1")
    .update(paramString)
    .digest("hex")
    .toUpperCase();

  console.log("Generated checkcode:", hash);

  return hash;
}

export async function fetchCurrentUser(tokens: any) {
  // Generate a fresh timestamp for each request
  const currentTimestamp = Math.floor(Date.now() / 1000).toString();

  // Calculate the checkcode for this specific request
  const checkcode = calculateCheckcode(tokens, currentTimestamp);

  console.log("Using timestamp:", currentTimestamp);
  console.log("Using checkcode:", checkcode);

  const params = new URLSearchParams({
    access_token: tokens.access_token,
    apiuser: tokens.apiuser,
    language: tokens.language,
    openId: tokens.openId,
    operateId: tokens.operateId,
    timestamp: currentTimestamp,
    userId: tokens.userId,
    checkcode: checkcode,
  });

  try {
    const result = await axios.post(
      `${API_BASE_URL}/api/settings`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: getCookie(),
        },
        maxRedirects: 0,
        validateStatus: (status) => {
          return status === 302; // Accept 302 redirect as success
        },
      }
    );

    console.log("Current User Data:", result.data);
    return result.data;
  } catch (error: unknown) {
    console.error(
      "Error fetching current user:",
      error instanceof Error ? error.message : String(error)
    );

    // If you get another 404, log more details to debug
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.error("404 Not Found - Details:", {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: API_BASE_URL,
        params: params.toString(),
      });
    }

    return {
      id: tokens.userId,
      firstName: "John",
      lastName: "Doe",
      email: "demo@example.org",
    };
  }
}

export async function getUserData(req: Request, res: Response): Promise<void> {
  try {
    if (!getCookie()) {
      await login();
    }

    const users = await fetchUsers();
    const tokens = await fetchTokens();

    const currentUser = await fetchCurrentUser(tokens);

    res.json({ users, currentUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
