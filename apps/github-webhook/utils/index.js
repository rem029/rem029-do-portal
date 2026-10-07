const { GITHUB_SECRET, PROJECT_PATH } = require("../config.js");

const crypto = require("crypto");
const { spawn } = require("child_process");

function verifySignature(req, res, buf) {
  const signature = req.headers["x-hub-signature-256"];
  const hmac = crypto.createHmac("sha256", GITHUB_SECRET);
  hmac.update(buf);
  const digest = `sha256=${hmac.digest("hex")}`;
  if (signature !== digest) {
    throw new Error("Invalid signature.");
  }
}

function getChangedFilesFromPushPayload(body) {
  const commits = Array.isArray(body?.commits) ? body.commits : [];
  const files = new Set();

  for (const commit of commits) {
    for (const key of ["added", "modified", "removed"]) {
      for (const file of commit?.[key] || []) {
        files.add(file);
      }
    }
  }

  return Array.from(files);
}

async function executeScriptASync(command, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running script '${command}' at ${cwd}`);

    // Split command into program and args
    const args = command.split(" ");
    const program = args.shift();

    const proc = spawn(program, args, {
      cwd: cwd || PROJECT_PATH,
      shell: "/bin/bash", // Explicit bash (not /bin/sh's dash) so `source`/nvm work.
    });

    // Stream output in real-time
    proc.stdout.on("data", (data) => {
      console.log(`${data}`);
    });

    proc.stderr.on("data", (data) => {
      console.error(`${data}`);
    });

    // Handle process completion
    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`Command '${command}' completed successfully`);
        resolve();
      } else {
        const error = new Error(
          `Command '${command}' failed with exit code ${code}`,
        );
        console.error(error.message);
        reject(error);
      }
    });

    // Handle process errors (e.g., command not found)
    proc.on("error", (error) => {
      console.error(`Failed to start command '${command}': ${error.message}`);
      reject(error);
    });
  });
}

module.exports = { verifySignature, executeScriptASync, getChangedFilesFromPushPayload };
