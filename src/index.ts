import { type Page, chromium, Browser } from "playwright";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/chat";

import { gptRequest } from "./openAi";
import { GPT_FUNCTIONS, GPT_MESSAGE_ROLE } from "./constants";
import { getAllInputFields, htmlToText, sleep } from "./utils";

let pageInstance: Page = null;
let browserInstance: Browser = null;
let activePageRawHtml = null;

const initBrowser = async () => {
  // const auth = `${process.env.BRIGHTDATA_USERNAME}:${process.env.BRIGHTDATA_PASSWORD}`;
  // const browser_url = `wss://${auth}@brd.superproxy.io:9222`;
  // use bright data browser for production
  // const browser = await chromium.connectOverCDP(browser_url);

  browserInstance = await chromium.launch({
    headless: Boolean(process.env.prod),
  });

  pageInstance = await browserInstance.newPage();
  return pageInstance;
};

const baseFunctions: ChatCompletionCreateParams.Function[] = [
  {
    name: GPT_FUNCTIONS.ANSWER_USER,
    description: "Inform the user if the tasks was completed successfully or not.",
    parameters: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "The answer to the user question",
        },
        url: {
          type: "string",
          description:
            "The relative element's or document url where the answer was found in search results. including '/-/'. If the answer was not found set to null. ",
        },
        found: {
          type: "boolean",
          description: "Set to true if successfully found the answer to the user question",
        },
      },
      required: ["answer", "url", "found"],
    },
  },
];

/**
 *
 * @param userPrompt: ChatCompletionMessageParam contain the user question that the assistant need to answer.
 * @param nextMessages: A list of history messages that will be sent to the assistant as context.
 * @param attempt: The number of retries the function was called recursively.
 * @returns Once the assistant goes through all functions calls will return a investigation object with the answer to the user question if found.
 */

const initInvestigation = async (userPrompt: ChatCompletionMessageParam, nextMessages: ChatCompletionMessageParam[] = [], attempt = 1) => {
  let findDataOnWebChatMessage: ChatCompletionMessageParam = {
    role: GPT_MESSAGE_ROLE.SYSTEM,
    content: `*OBJECTIVE:* You have been tasked to extract data from the internet based on a task given by the user. You are connected to a web browser which you can control via function calls.`,
  };

  const messages: ChatCompletionMessageParam[] = [findDataOnWebChatMessage, userPrompt, ...nextMessages];

  const functions = [
    {
      name: GPT_FUNCTIONS.GO_TO_URL,
      description: "Goes to a specific URL and return page content and set the current active page in memory.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to go to (including protocol)",
          },
        },
        required: ["url"],
      },
    },
    ...baseFunctions,
  ];

  try {
    const { investigation, functionName } = await gptRequest(messages, functions);
    if (functionName === GPT_FUNCTIONS.GO_TO_URL) {
      // validate url
      const url = investigation.url;

      console.log("goto_url", url);
      await pageInstance.goto(url);
      await sleep(4000);
      activePageRawHtml = await pageInstance.content();
      const pageText = htmlToText(activePageRawHtml);
      return await initInvestigation(userPrompt, [
        {
          name: GPT_FUNCTIONS.GO_TO_URL,
          role: GPT_MESSAGE_ROLE.FUNCTION,
          content: pageText,
        },
      ]);
    }
    return {
      investigation,
      functionName,
    };
  } catch (error) {
    console.log("error", error);
    if (attempt > 4) {
      const errorId = Math.floor(Math.random() * 1000);
      console.log(`${errorId} - [preformSiteSearch] error catch. ${error}}`);
      return {
        investigation: {
          answer: `Could not find answer. something went wrong internally [preformSiteSearch] ${errorId}`,
          found: false,
        },
      };
    }
    attempt++;
    return await initInvestigation(userPrompt, messages, attempt);
  }
};

/**
 *
 * @param userPrompt: ChatCompletionMessageParam contain the user question that the assistant need to answer.
 * @param nextMessages: A list of history messages that will be sent to the assistant as context.
 * @param attempt: The number of retries the function was called recursively.
 * @returns Once the assistant goes through all functions calls will return a investigation object with the answer to the user question if found.
 */
const preformSiteSearch = async (userPrompt: ChatCompletionMessageParam, nextMessages: ChatCompletionMessageParam[] = [], attempt = 1) => {
  let preformSiteSearchChatMessage: ChatCompletionMessageParam = {
    role: GPT_MESSAGE_ROLE.SYSTEM,
    content: `*OBJECTIVE:*
    You tasked to preform a search on a specific site using the website search box to answer the user question.
    *NOTES:*
    To preform search first you need to find the search box css selector on the page, returned by ${GPT_FUNCTIONS.GET_PAGE_INPUTS} than call the ${GPT_FUNCTIONS.PREFORM_SEARCH} function with the selector and the search term. ${GPT_FUNCTIONS.PREFORM_SEARCH} function selector argument must be from the current page in memory. If the selector is not from the current page in memory the function will fail. To get the current page inputs use ${GPT_FUNCTIONS.GET_PAGE_INPUTS} function than select the input you want to search in.`,
  };
  const messages: ChatCompletionMessageParam[] = [preformSiteSearchChatMessage, userPrompt, ...nextMessages];

  const functions = [
    {
      name: GPT_FUNCTIONS.GET_PAGE_INPUTS,
      description: "Return all page inputs fields as html of the current active page in memory",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to go to (including protocol)",
          },
        },
      },
    },
    {
      name: GPT_FUNCTIONS.PREFORM_SEARCH,
      description: "Preform search in the current active page and return the search results as text.",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: `Exact CSS selector for the visible input include tag name from on the current active page in memory. If the selector is not from the current page in memory the function will fail. To get the current page inputs use ${GPT_FUNCTIONS.GET_PAGE_INPUTS} function`,
          },
          text: {
            type: "string",
            description: "search term to search for in the website search box. Object.",
          },
        },
        required: ["selector", "text"],
      },
    },
    ...baseFunctions,
  ];

  try {
    const { investigation, functionName } = await gptRequest(messages, functions);
    if (functionName === GPT_FUNCTIONS.GET_PAGE_INPUTS) {
      const pageInputs = getAllInputFields(activePageRawHtml);
      console.log("get_page_inputs");
      return await preformSiteSearch(userPrompt, [
        {
          name: GPT_FUNCTIONS.GET_PAGE_INPUTS,
          role: GPT_MESSAGE_ROLE.FUNCTION,
          content: pageInputs,
        },
      ]);
    } else if (functionName === GPT_FUNCTIONS.PREFORM_SEARCH) {
      if (!investigation.selector || !investigation.text) throw new Error("selector or text is missing");

      const { selector, text } = investigation;
      console.log("preform_search", selector, text);
      await pageInstance.locator(selector).fill(text);
      await pageInstance.press(selector, "Enter");
      await sleep(4000);
      activePageRawHtml = await pageInstance.content();
      return await preformSiteSearch(userPrompt, [
        {
          name: GPT_FUNCTIONS.PREFORM_SEARCH,
          role: GPT_MESSAGE_ROLE.FUNCTION,
          content: htmlToText(activePageRawHtml),
        },
      ]);
    }
    return {
      investigation,
      functionName,
    };
  } catch (error) {
    console.log("error", error);
    if (attempt > 4) {
      const errorId = Math.floor(Math.random() * 1000);
      console.log(`${errorId} - [preformSiteSearch] error catch. ${error}}`);
      return {
        investigation: {
          answer: `Could not find answer. something went wrong internally [preformSiteSearch] ${errorId}`,
          found: false,
        },
      };
    }
    attempt++;
    return await preformSiteSearch(userPrompt, messages, attempt);
  }
};

/**
 * Create a page evidence in the database.
 * @param investigation
 * @returns void
 * @example
 * createPageEvidence({
 * primaryUrl: "https://www.charities.gov.sg/Pages/AdvanceSearch.aspx",
 * secondaryUrl: "hhttps://www.charities.gov.sg/_layouts/15/CPInternet/SearchOrgProfile.aspx?q=ZGY0Y2FmZDMtNzk2NS1lMzExLThmZGEtMDA1MDU2YjMwNDg1",
 * found: true,
 * answer: "Red Cross is a registered charity with IPC status.",
 * });
 **/
const createPageEvidence = async (investigation: any) => {
  // TODO: create page evidence in the database.
  console.log("create_page_evidence", investigation);
};

/**
 * A list of actions ChatGpt to preform to find the answer to the user question.
 */
const actions = [initInvestigation, preformSiteSearch];

// const userQuestion = "What is the Status of Red Cross? https://www.charities.gov.sg/Pages/AdvanceSearch.aspx";
// const userQuestion = "Verify ‘Leslie Toth’ can be found on the ASC website. https://www.asc.ca/en/enforcement/notices-decisions-and-orders";
// const userQuestion = "Verify ‘Husam Alrubaye’ can be found on the ASC website search results. https://www.asc.ca/en/enforcement/notices-decisions-and-orders";
// const userQuestion = "What is the Status of Red Cross? https://www.charities.gov.sg/Pages/AdvanceSearch.aspx";
// const userQuestion = "What is the review of starbucks on 99 jackson st, San Francisco, CA 94111, USA? yelp";
// const userQuestion = "How many subscribers does MrBeast has on youtube?";
// const userQuestion = "What fun things todo in San Francisco on tuesday?";
const userQuestion = "Verify this ebay listing with id 144944083778 has red color available";

(async () => {
  await initBrowser();

  const userPrompt: ChatCompletionMessageParam = {
    role: GPT_MESSAGE_ROLE.USER,
    content: userQuestion,
  };

  let currentActionIndex = 0;
  let taskCompleted = false;
  let investigationResults = null;

  while (currentActionIndex < actions.length && !taskCompleted) {
    const action = actions[currentActionIndex];
    const { investigation } = await action(userPrompt);
    const { found } = investigation;
    taskCompleted = found;
    investigationResults = investigation;
    currentActionIndex++;
  }
  // No more investigation to preform.

  const primaryUrl = pageInstance.url();
  const baseUrl = primaryUrl.match(/^https?:\/\/[^#?\/]+/)[0];

  const secondaryUrlPath = investigationResults.url ? investigationResults.url.replace(/[\[\]]/g, "") : null;
  const secondaryUrlFull = secondaryUrlPath ? (secondaryUrlPath?.includes("http") ? secondaryUrlPath : `${baseUrl}${secondaryUrlPath}`) : null;

  await createPageEvidence({
    primaryUrl,
    secondaryUrl: secondaryUrlFull,
    found: investigationResults.found,
    answer: investigationResults.answer,
  });
  await browserInstance.close();
})();
