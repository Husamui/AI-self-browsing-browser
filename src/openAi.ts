import OpenAI from "openai";
import { type ChatCompletionCreateParams, type ChatCompletionMessageParam } from "openai/resources/chat";

import { GPT_MODEL, GPT_TEMPERATURE, OPENAI_API_KEY } from "./constants";

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY env variable is not set");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const gptRequest = async (messages: ChatCompletionMessageParam[], functions: ChatCompletionCreateParams.Function[]) => {
  try {
    const modelOptions = {
      messages,
      functions,
      model: GPT_MODEL,
      temperature: GPT_TEMPERATURE,
    };
    const response = await openai.chat.completions.create(modelOptions);
    const choice = response.choices[0];
    const finish_reason = choice.finish_reason;

    if (!choice.message || !choice.message.function_call) {
      throw new Error("No message in response");
    }

    const function_name = choice.message.function_call.name;
    const investigation: Record<string, string> = JSON.parse(choice.message.function_call.arguments);

    return {
      investigation,
      functionName: function_name,
    };
  } catch (error) {
    // TODO better logging.
    // TODO retries?
    console.log("error", error);
  }
};
