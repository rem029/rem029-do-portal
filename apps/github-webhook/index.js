require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { verifySignature, executeScriptASync, getChangedFilesFromPushPayload } = require("./utils");

const { PORT, GITHUB_TRIGGER_BRANCH, SCRIPTS_BRANCH } = require("./config");

const app = express();

app.post(
  "/webhook",
  // GitHub push payloads can reach 25MB; body-parser's default limit is 100kb.
  bodyParser.json({ verify: verifySignature, limit: "25mb" }),
  async (req, res) => {
    const event = req.headers["x-github-event"];
    const branch = req.body.ref;

    try {
      if (event === "push" && branch === `refs/heads/${GITHUB_TRIGGER_BRANCH}`) {
        console.log("Received push event for branch:", branch);

        // Respond immediately to GitHub
        res.status(200).send("Webhook received, build starting");

        const scriptsConfig = SCRIPTS_BRANCH[GITHUB_TRIGGER_BRANCH] || [];
        const scripts =
          typeof scriptsConfig === "function"
            ? scriptsConfig(getChangedFilesFromPushPayload(req.body))
            : scriptsConfig;
        (async () => {
          try {
            for (const { cmd, cwd } of scripts) {
              await executeScriptASync(cmd, cwd);
            }
            console.log("Scripts execution completed successfully");
          } catch (error) {
            console.error(
              "Script execution failed:",
              error?.message || "Unknown error",
            );
          }
        })();

        return;
      } else {
        console.log(`Push event ignored: branch is ${branch}`);
        return res.status(200).send("OK but branch ignored");
      }
    } catch (error) {
      console.log(`Script execution failed`, error?.message || "Unknown error");
      res.status(500).send(`Error caught: ${error?.message || "Unknown error"}`);
    }
  },
);

app.listen(PORT, () => {
  console.log(`GitHub webhook server running on port ${PORT}`);
});
