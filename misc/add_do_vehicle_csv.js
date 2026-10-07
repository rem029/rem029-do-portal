const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const init = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // The first argument will be the API key
  const csvFile = args[1]; // The second argument will be the csvFile
  const environment = args[2] || "dev";
  const rateLimitToken = args[3] || "";

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

  const csvFilePath = path.resolve(__dirname, csvFile);
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  const csvData = fs.readFileSync(csvFilePath, "utf-8");

  // Parse CSV data
  const records = parse(csvData, {
    columns: true, // Use the first row as column headers
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} records to add.`);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let count = 1;
  for (const record of records) {
    const company = record["company"] || null; // Ensure company is trimmed and not undefined
    let ownerType = "external";

    console.log(`Processing record for`, record);

    // Determine owner type based on company name
    if (
      company &&
      (company.includes("Doha Oasis") ||
        company.includes("Printemps") ||
        company.includes("ACCOR") ||
        company.includes("Ever Fashion") ||
        company.includes("Ever Fashions") ||
        company.includes("Quest") ||
        company.includes("Doha Quest"))
    ) {
      ownerType = "employee";
    }

    const vehicleData = {
      plate_no: record.plate,
      parking_no: record.parking || null,
      remarks: record.remarks || null,
      registration_expiry: record.registration_expiry
        ? new Date(record.registration_expiry).toISOString()
        : null,
      template: record.template ? Number(record.template) : null,
      vehicle: {
        color: null, // Add color if available in the future
        make: record.Car || null,
        model: record.model || null, // Add model if available in the future
        year: null, // Add year if available in the future
      },
      owner: {
        type: ownerType,
        company: company, // Ensure company is passed correctly
        email: null, // Add email if available in the future
        name: record.name || null,
        phone: record.mobile || null,
        department: null, // Add department if available in the future
        designation: null, // Add designation if available in the future
      },
    };

    console.log(`Processing vehicleData`, vehicleData);

    console.log(`Adding record for plate number`, record.plate);
    console.log(`Adding record`, count, `of`, records.length);

    try {
      const response = await fetch(url[environment], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${apiKey}`,
          ...(rateLimitToken && { "x-rate-limit-token": rateLimitToken }),
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log(
        `Successfully added record for plate number`,
        result?.doc?.plate_no,
      );
    } catch (error) {
      console.error(
        `Error adding record for plate number ${record.plate}:`,
        "record",
        record,
        "error:",
        error,
      );
    }
    count = count + 1;
    await delay(500); // Add a 2-second delay between requests
  }
};

init();
