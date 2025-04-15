import { prompt } from "./prompt";
import { inferImage } from "./inference";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const api = {
  prompt,
  inference: {
    inferImage,
  },
};

export default api;
