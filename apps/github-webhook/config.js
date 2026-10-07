const PORT = process.env.PORT || 4000;
const GITHUB_SECRET = process.env.GITHUB_SECRET || "your_secret";
const GITHUB_TRIGGER_BRANCH = process.env.TRIGGER_BRANCH || "production";

const PROJECT_PATH = process.env.PROJECT_PATH || "/home/lawrenceponce/survey-do";
const PROJECT_PATH_FRONTEND = PROJECT_PATH + "/apps/frontend";
const PROJECT_PATH_BACKEND = PROJECT_PATH + "/apps/backend-admin";
const PROJECT_PATH_BACKEND_V3 = PROJECT_PATH + "/apps/backend-admin-v3";

// pm2/yarn need Node 22 on PATH; the webhook's own process may not inherit nvm's shell init.
const NVM_INIT = "source ~/.nvm/nvm.sh && nvm use 22";

const APP_PATH_PREFIXES = {
  backendAdmin: "apps/backend-admin/",
  backendAdminV3: "apps/backend-admin-v3/",
};

const SCRIPTS_FRONTEND = [
  { cmd: "yarn install", cwd: PROJECT_PATH_FRONTEND },
  { cmd: "yarn build", cwd: PROJECT_PATH_FRONTEND },
];

const SCRIPTS_BACKEND = [
  { cmd: "yarn install", cwd: PROJECT_PATH_BACKEND },
  { cmd: "yarn build", cwd: PROJECT_PATH_BACKEND },
  { cmd: "yarn migrate:latest", cwd: PROJECT_PATH_BACKEND },
  { cmd: "pm2 delete do-app-backend-admin || true", cwd: PROJECT_PATH_BACKEND },
  { cmd: "yarn start:pm2", cwd: PROJECT_PATH_BACKEND },
  { cmd: "yarn start:pm2:github-webhook", cwd: PROJECT_PATH },
];

const SCRIPTS_BACKEND_V3 = [
  { cmd: `${NVM_INIT} && pm2 delete do-app-backend-admin-v3 || true`, cwd: PROJECT_PATH_BACKEND_V3 },
  { cmd: `${NVM_INIT} && pm2 delete do-app-backend-admin-v3-jobs || true`, cwd: PROJECT_PATH_BACKEND_V3 },
  { cmd: `${NVM_INIT} && yarn install`, cwd: PROJECT_PATH_BACKEND_V3 },
  { cmd: `${NVM_INIT} && yarn ci`, cwd: PROJECT_PATH_BACKEND_V3 },
  { cmd: `${NVM_INIT} && yarn start:pm2`, cwd: PROJECT_PATH_BACKEND_V3 },
  { cmd: `${NVM_INIT} && yarn start:jobs:pm2`, cwd: PROJECT_PATH_BACKEND_V3 },
];

const SCRIPTS = [
  { cmd: `git pull origin ${GITHUB_TRIGGER_BRANCH}`, cwd: PROJECT_PATH },
  ...SCRIPTS_FRONTEND,
  ...SCRIPTS_BACKEND,
];

function buildProductionScripts(changedFiles = []) {
  const touchesBackendAdmin = changedFiles.some((f) => f.startsWith(APP_PATH_PREFIXES.backendAdmin));
  const touchesBackendAdminV3 = changedFiles.some((f) => f.startsWith(APP_PATH_PREFIXES.backendAdminV3));

  return [
    { cmd: `git pull origin ${GITHUB_TRIGGER_BRANCH}`, cwd: PROJECT_PATH },
    ...SCRIPTS_FRONTEND,
    ...(touchesBackendAdmin ? SCRIPTS_BACKEND : []),
    ...(touchesBackendAdminV3 ? SCRIPTS_BACKEND_V3 : []),
  ];
}

const SCRIPTS_BRANCH = {
  production: buildProductionScripts,
  dev: [
    { cmd: `git reset --hard`, cwd: PROJECT_PATH },
    { cmd: `git pull origin ${GITHUB_TRIGGER_BRANCH}`, cwd: PROJECT_PATH },
    { cmd: "yarn install", cwd: PROJECT_PATH_FRONTEND },
    { cmd: "yarn build", cwd: PROJECT_PATH_FRONTEND },
    { cmd: "yarn install", cwd: PROJECT_PATH_BACKEND },
    { cmd: "yarn build", cwd: PROJECT_PATH_BACKEND },
    { cmd: "pm2 delete do-app-backend-admin || true", cwd: PROJECT_PATH_BACKEND },
    { cmd: "yarn start:pm2", cwd: PROJECT_PATH_BACKEND },
  ],
};

module.exports = {
  PORT,
  GITHUB_SECRET,
  PROJECT_PATH,
  GITHUB_TRIGGER_BRANCH,
  PROJECT_PATH_FRONTEND,
  PROJECT_PATH_BACKEND,
  PROJECT_PATH_BACKEND_V3,
  SCRIPTS_FRONTEND,
  SCRIPTS_BACKEND,
  SCRIPTS_BACKEND_V3,
  SCRIPTS,
  SCRIPTS_BRANCH,
};
