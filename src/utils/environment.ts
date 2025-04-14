export const getB64Env = (b64EnvVar: string) => {
  if (!process.env?.[b64EnvVar]) {
    throw new Error(`Environment variable ${b64EnvVar} is not set`);
  }

  const buff = Buffer.from(process.env[b64EnvVar], "base64");
  return buff.toString("ascii");
};

export const getEnv = (envVar: string) => {
  if (!process.env?.[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }

  return process.env[envVar];
};
