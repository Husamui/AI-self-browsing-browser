export const GPT_MODEL = "gpt-3.5-turbo-16k" as const;
export const GPT_TEMPERATURE = 0 as const;

export const GPT_MESSAGE_ROLE = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
  FUNCTION: "function",
} as const;

export const GPT_FUNCTIONS = {
  GO_TO_URL: "GO_TO_URL",
  ANSWER_USER: "ANSWER_USER",
  GET_PAGE_INPUTS: "get_page_inputs",
  PREFORM_SEARCH: "preform_search",
} as const;

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
