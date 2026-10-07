const init = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // The first argument will be the API key

  if (!apiKey) {
    console.error("Error: API key is required. Usage: node emp_question_new_add_printemps_july2026.js YOUR_API_KEY");
    process.exit(1); // Exit if no API key is provided
  }

  try {
    const context = { "x-rate-limit-token": process.env.MIGRATION_TOKEN || "" };

    console.log("Fetching questions from API...");
    const fetchResponse = await fetch(
      "http://private.dohaoasis.com/payload/api/employee-questions-new?limit=0&where[question_group][equals]=9",
      { headers: { "Content-Type": "application/json", Authorization: `users API-Key ${apiKey}`, ...context } },
    );
    const data = await fetchResponse.json();
    if (!data || !data.docs) {
      throw new Error("Invalid response format from fetch API");
    }

    const docs = data.docs;
    console.log(`Found ${docs.length} questions fetched.`);

    for (const doc of docs) {
      // Clean up the object to post as a new record
      const payload = {
        order: doc.order,
        default_title: doc.default_title,
        default_subtitle: doc.default_subtitle,
        group_label: doc.group_label,
        required: doc.required,
        question_group: 15,
        question_type: doc.question_type,
        max_scale: doc.max_scale,
        rating_labels: doc.rating_labels ? doc.rating_labels.map(({ id, ...rest }) => rest) : undefined,
        select_options: doc.select_options ? doc.select_options.map(({ id, ...rest }) => rest) : undefined,
        item: doc.item ? doc.item.map(({ id, ...rest }) => rest) : undefined,
      };

      console.log(`Adding question: ${payload.default_title}`);
      const response = await fetch("http://private.dohaoasis.com/payload/api/employee-questions-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${apiKey}`,
          ...context,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response:", await response.json());
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

init();
