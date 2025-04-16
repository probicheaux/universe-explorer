import { ModelInfo } from "./api/inference";

export function parseRoboflowSearchModelHit(hit: any): ModelInfo {
  console.log(
    `hit models for project ${hit.fields.name?.[0]} (${hit.fields.url?.[0]})`,
    hit.fields.models
  );
  const latestModel =
    hit.fields.models?.length && hit.fields.models.length > 0
      ? hit.fields.models[hit.fields.models.length - 1]
      : hit.fields.latestVersion[0];
  return {
    id: `${hit.fields.url?.[0]}/${latestModel}`,
    datasetId: hit.fields.dataset_id?.[0],
    name: hit.fields.name?.[0],
    type: hit.fields.type?.[0],
    url: hit.fields.url?.[0],
    annotation: hit.fields.annotation?.[0],
    bestModelScore: hit.fields.bestModelScore?.[0],
    icon: hit.fields.icon?.[0],
    iconOwner: hit.fields.iconOwner?.[0],
    images: hit.fields.images?.[0],
    models: hit.fields.models ?? [],
    version: latestModel,
    semanticScore: hit._score,
    universe: hit.fields.universe?.[0],
    universeStats: hit.fields.universeStats?.[0],
  };
}
