const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const downloadMedia = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // API key passed as the first argument
  const outputDir = args[1] || "media"; // Output directory for downloaded files
  const rateLimitToken = args[2] || "";

  if (!apiKey) {
    console.error(
      "Error: API key is required. Usage: node download_media.js YOUR_API_KEY [OUTPUT_DIR]",
    );
    process.exit(1);
  }

  const url =
    "https://public.dohaoasis.com/payload/api/dohaoasis-parking-vehicle?limit=0";

  console.log("apikey", apiKey);
  console.log("outputDir", outputDir);
  console.log("rateLimitToken", rateLimitToken);

  try {
    console.log("Fetching vehicles...");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `users API-Key ${apiKey}`,
        ...(rateLimitToken && { "x-rate-limit-token": rateLimitToken }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
    }

    const data = await response.json();
    const vehicleItems = data.docs || [];

    if (vehicleItems.length === 0) {
      console.log("No media items found.");
      return;
    }

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Found ${vehicleItems.length} media items. Starting download...`);

    for (const item of vehicleItems) {
      const file = item.qr;
      const fileUrl = file.url; // Assuming the media URL is in the `url` field
      const fileName = path.basename(fileUrl); // Extract the file name from the URL
      const filePath = path.join(outputDir, fileName);

      console.log(`Downloading ${fileUrl}...`);

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        console.error(`Failed to download ${fileUrl}: ${fileResponse.statusText}`);
        continue;
      }

      // Save the file using arrayBuffer
      const buffer = await fileResponse.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);
      fs.writeFileSync(filePath, fileBuffer);

      console.log(`Saved ${fileName} to ${filePath}`);

      // // Convert SVG to PNG if the file is an SVG
      // if (fileName.endsWith(".svg")) {
      //   const pngFilePath = filePath.replace(".svg", ".png");
      //   try {
      //     await sharp(fileBuffer).png().toFile(pngFilePath);
      //     console.log(`Converted ${fileName} to PNG: ${pngFilePath}`);
      //   } catch (error) {
      //     console.error(`Failed to convert ${fileName} to PNG:`, error.message);
      //   }
      // }
    }

    console.log("All media downloaded successfully.");
  } catch (error) {
    console.error("Error:", error.message);
  }
};

downloadMedia();
