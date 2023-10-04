import { type Page, chromium, devices, Browser } from "playwright";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let pageInstance: Page = null;
let browserInstance: Browser = null;

const initBrowser = async () => {
  // Setup

  // const auth = `${process.env.BRIGHTDATA_USERNAME}:${process.env.BRIGHTDATA_PASSWORD}`;
  // const browser_url = `wss://${auth}@brd.superproxy.io:9222`;

  // use bright data browser for production
  // const browser = await chromium.connectOverCDP(browser_url);
  browserInstance = await chromium.launch({
    headless: false,
  });

  pageInstance = await browserInstance.newPage();
};

(async () => {
  // const chatCompletion = await openai.chat.completions.create({
  //   messages: [{ role: "user", content: "Say this is a test" }],
  //   model: "gpt-3.5-turbo",
  // });
  // console.log("chatCompletion", chatCompletion);
  // await initBrowser();
  // await page_instance.goto("https://www.google.com");
  // console.log(`the title is: ` + (await page_instance.title()));
  // await browser_instance.close();
})();
