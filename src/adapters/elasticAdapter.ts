import { Client, estypes } from "@elastic/elasticsearch";
import { getEnv, getB64Env } from "../utils/environment";

let CLIENT: Client | null = null;

export const FIELDS_TO_FETCH = [
  "dataset_id",
  "annotation",
  "type",
  "name",
  "url",
  "icon",
  "iconOwner",
  "iconHasAnnotation",
  "images",
  "models",
  "universe",
  "universeStats",
  "class_counts",
  "updated_seconds",
  "mostRecentModelId",
  "latestVersion",
  "bestModelScore",
];

const DEFAULT_SORT = [
  {
    "universe.stars": {
      order: "desc",
      missing: "_last",
      nested: {
        path: "universe",
      },
    },
  },
  {
    bestModelScore: {
      order: "desc",
      missing: "_last",
    },
  },
  {
    images: "desc",
  },
] as estypes.Sort;

type SearchDatasetsPayload = {
  query: estypes.QueryDslQueryContainer;
  size?: number;
  fields?: string[];
  sort?: estypes.Sort;
  searchAfter?: estypes.SortResults;
};

const getClient = (): Client => {
  if (!CLIENT) {
    const elasticSearchAuth = JSON.parse(getB64Env("SEARCH_SECRET_B64"));

    CLIENT = new Client({
      node: getEnv("ELASTICSEARCH_URL"),
      auth: {
        username: elasticSearchAuth.username,
        password: elasticSearchAuth.password,
      },
      requestTimeout: 30000,
      maxRetries: 3,
      compression: true,
    });
  }
  return CLIENT;
};

export const searchDatasets = async ({
  query,
  size = 10000,
  fields = FIELDS_TO_FETCH,
  sort = DEFAULT_SORT,
  searchAfter,
}: SearchDatasetsPayload) => {
  const client = getClient();

  const searchPayload = {
    index: "datasets-prod-1.0.6",
    size,
    query,
    sort,
  } as estypes.SearchRequest;

  if (searchAfter) {
    searchPayload.search_after = searchAfter;
  }

  if (fields.length > 0) {
    searchPayload._source = fields;
  }

  return client.search(searchPayload);
};

export const searchDatasetsByDatasetIds = async (datasetIds: string[]) => {
  // Validate input
  if (!datasetIds || datasetIds.length === 0) {
    console.warn(
      "searchDatasetsByDatasetIds called with empty datasetIds array"
    );
    return { hits: { hits: [], total: { value: 0 } } };
  }

  // Filter out any empty or invalid IDs
  const validDatasetIds = datasetIds.filter(
    (id) => id && typeof id === "string" && id.trim() !== ""
  );

  if (validDatasetIds.length === 0) {
    console.warn("No valid dataset IDs provided to searchDatasetsByDatasetIds");
    return { hits: { hits: [], total: { value: 0 } } };
  }

  const query = {
    bool: {
      must: [{ terms: { dataset_id: validDatasetIds } }],
    },
  };

  return searchDatasets({
    query,
    size: 10000,
    fields: FIELDS_TO_FETCH,
    sort: DEFAULT_SORT,
  });
};

export const searchTopObjectDetectionTrainedDatasets = async () => {
  const query = {
    bool: {
      must: [
        { term: { trainedVersion: true } },
        { term: { public: true } },
        { term: { type: "object-detection" } },
      ],
      must_not: [
        {
          terms: {
            "universe.tags": ["nsfw", "nsfl", "pii"],
          },
        },
        {
          bool: {
            must: [
              {
                terms: {
                  "universe.tags": ["ai-nsfw", "ai-pii", "ai-nsfl"],
                },
              },
              {
                bool: {
                  must_not: {
                    term: {
                      "universe.tags": "false-positive",
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  return searchDatasets({
    query,
    size: 10000,
    fields: FIELDS_TO_FETCH,
    sort: DEFAULT_SORT,
  });
};
