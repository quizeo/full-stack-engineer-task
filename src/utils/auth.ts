// utils/auth.js
import * as cheerio from "cheerio";
import axios from "axios";

const BASE_URL = "https://challenge.sunvoy.com";
const EMAIL = "demo@example.org";
const PASSWORD = "test";

let cookie = "";

export async function getNonce() {
  const res = await axios.get(`${BASE_URL}/login`);
  const html = res.data;
  const $ = cheerio.load(html);
  return $('input[name="nonce"]').val()?.toString() || "";
}

export async function login() {
  const nonce = await getNonce();

  const params = new URLSearchParams({
    username: EMAIL,
    password: PASSWORD,
    nonce,
  });

  const res = await axios.post(`${BASE_URL}/login`, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    maxRedirects: 0, // Prevent automatic redirects to handle manually
    validateStatus: (status) => {
      return status === 302; // Accept 302 redirect as success
    },
  });

  if (res.status !== 302) throw new Error("Login failed");

  const setCookie = res.headers["set-cookie"];
  if (!setCookie || setCookie.length === 0)
    throw new Error("No cookie received");

  cookie = setCookie[0].split(";")[0];
}

export function getCookie() {
  return cookie;
}
