const init = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // The first argument will be the API key
  const environment = args[1] || "dev";
  const rateLimitToken = args[2] || "";
  const concurrency = parseInt(args[3], 10) || 3; // optional 4th arg, default 3

  const url = {
    dev: "http://localhost:3005/payload/api/dohaoasis-parking-vehicle",
    prod: "https://public.dohaoasis.com/payload/api/dohaoasis-parking-vehicle",
  };

  if (!apiKey) {
    console.error(
      "Error: API key is required. Usage: node add_parking_vehicles.js YOUR_API_KEY",
    );
    process.exit(1); // Exit if no API key is provided
  }

  if (!environment) {
    console.log("Error: Environment not defined");
    process.exit(1);
  }

  const templateIds = [
    // [1, 150], // Banyan Tree
    // [2, 150], // Concession
    // [3, 150], // Consignment
    // [4, 150], // Contractor
    // [5, 600], // Employee
    // [6, 100], // Ever Fashion
    // [7, 100], // Kien
    [8, 100], // Novo
    [9, 100], // Padel
    [10, 300], // Printemps
    [11, 300], // Doha Quest
  ];

  // helper to perform a single POST
  const postOne = async (template, count, n) => {
    try {
      console.log(
        `Template: ${template} - Adding record ${count} of ${n} ${environment}`,
      );
      const response = await fetch(url[environment], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${apiKey}`,
          ...(rateLimitToken && { "x-rate-limit-token": rateLimitToken }),
        },
        body: JSON.stringify({ template: template }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      console.log(
        `Template: ${template} - Successfully added record ${count} of ${n}`,
      );
    } catch (error) {
      console.log(
        `Template: ${template} - Error adding record ${count} of ${n}:`,
        error,
      );
    }
  };

  // concurrency runner: accepts array of functions that return promises
  const runOneWorkerPerTemplate = async () => {
    const workers = templateIds.map(([template, n]) =>
      (async () => {
        for (let count = 1; count <= n; count++) {
          await postOne(template, count, n);
        }
      })(),
    );
    await Promise.all(workers);
  };

  console.log(
    `Starting ${templateIds.reduce(
      (s, [, n]) => s + n,
      0,
    )} requests — 1 worker per template (${templateIds.length} workers)`,
  );
  await runOneWorkerPerTemplate();
  console.log("All requests completed");
};

init();
