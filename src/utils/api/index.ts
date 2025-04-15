import { inferImage } from "./inference";
import { send as sendPrompt } from "./prompt";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const inference = {
  inferImage,
};

const prompt = {
  send: sendPrompt,
};

export default {
  inference,
  prompt,
};
