import { getSearchBackendAuthToken } from "./roboflowSearchAuthAdapter";
import { getEnv } from "@/utils/environment";
import { estypes } from "@elastic/elasticsearch";
import axios from "axios";

async function getToken() {
  try {
    return await getSearchBackendAuthToken();
  } catch (error) {
    console.error(
      "[Roboflow Search Auth] error getting search backend auth token",
      error
    );

    throw error;
  }
}

type RoboflowSearchRegularSortQueryValue = "asc" | "desc";

interface RoboflowSearchNestedSortQueryValue {
  order: "asc" | "desc";
  nested: { path: string };
  missing: "_last";
}

interface RoboflowSearchSortQueryTerm {
  [key: string]:
    | RoboflowSearchRegularSortQueryValue
    | RoboflowSearchNestedSortQueryValue;
}

type RoboflowSearchRangedQueryValue = { gte?: number; lte?: number };

interface RoboflowSearchDatasetPayload {
  index?: string;
  prompt?: string;
  prompt_image?: string;
  type?: string;
  from: number;
  size: number;
  public?: boolean;
  project?: string;
  fields: string[];
  sort: RoboflowSearchSortQueryTerm[];
  images?: RoboflowSearchRangedQueryValue;
  "universe.stars"?: RoboflowSearchRangedQueryValue;
  "universe.views"?: RoboflowSearchRangedQueryValue;
  "universe.downloads"?: RoboflowSearchRangedQueryValue;
  "universe.tags"?: string[];
  filter_nsfw?: boolean;
  "-forkedFrom"?: { exists: boolean };
  industry?: string;
  tags?: string[];
  trainedVersion?: boolean;
  modelType?: string;
  search_fields?: string[]; // this tells ES which fields to search for metadata
  return_total_results?: boolean;
  fuzzy?: boolean;
  reverse?: boolean;
  research?: boolean;
  classes?: string[];
  prompt_dataset_id?: string;
  prompt_dataset_tag?: string;
  max_knn_score?: number;
}

interface RoboflowSearchImageParams {
  new: boolean;
  prompt?: string | undefined;
  prompt_image?: string | undefined;
}

interface RoboflowSearchImagePayload {
  new?: boolean;
  prompt?: string;
  prompt_image?: string;
  knn?: boolean;
}

interface RoboflowSearchResponse {
  aggregations?: object;
  hits: estypes.SearchHit[];
  from: number;
  info?: object;
}

export const roboflowSearchImages = async (
  searchImageParams: RoboflowSearchImageParams
) => {
  // const token = await getToken();

  // const OBJECTS_365_INDEXES = {
  //   old: "images-prod-1.0.1-*",
  //   new: "images-joao-new-mapping-2",
  // };

  const payload = {
    // index: OBJECTS_365_INDEXES[searchImageParams.new ? "new" : "old"],
    index: "images-joao-new-mapping-2*",
    fields: ["image_id", "owner"],
    from: 0,
    size: 50,
  } as RoboflowSearchImagePayload;

  if (searchImageParams.new) {
    payload.knn = true;
  }

  if (searchImageParams.prompt) {
    payload.prompt = searchImageParams.prompt;
  }

  if (searchImageParams.prompt_image) {
    payload.prompt_image = searchImageParams.prompt_image;
  }

  console.log("payload", payload);

  try {
    const results = await axios({
      method: "POST",
      // url: getEnv("SEARCH_CONFIG_QUERY_URL") + "/query-images",
      url: "https://query-featurizer-liwxmo5pvq-uc.a.run.app/query-images",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`,
      },
      data: payload,
    });

    return results.data as RoboflowSearchResponse;
  } catch (error) {
    console.error(
      "[Roboflow Search] error searching for dataset",
      JSON.stringify(payload),
      error
    );

    throw error;
  }
};

export const roboflowSearchDatasets = async (
  searchParams: RoboflowSearchDatasetPayload
): Promise<RoboflowSearchResponse> => {
  const token = await getToken();

  const { fuzzy, ...rest } = searchParams;

  const payload = {
    index: "datasets-prod-1.0.6",
    project: "roboflow-platform",
    ...rest,
  };

  try {
    const results = await axios({
      method: "POST",
      url: getEnv("SEARCH_CONFIG_QUERY_URL") + "/query-datasets",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: payload,
    });

    return results.data as RoboflowSearchResponse;
  } catch (error) {
    console.error(
      "[Roboflow Search] error searching for dataset",
      JSON.stringify(payload),
      error
    );

    throw error;
  }
};
