const init = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // The first argument will be the API key
  const newUserId = 12;
  const questionGroupId = 2;

  if (!apiKey) {
    console.error("Error: API key is required. Usage: node add_emp.js YOUR_API_KEY");
    process.exit(1); // Exit if no API key is provided
  }

  const responseQs = await fetch(
    `http://private.dohaoasis.com/payload/api/employee-questions-new?limit=1000000&sort=id&where[question_group][equals]=${questionGroupId}&where[id][equals]=95`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `users API-Key ${apiKey}`,
      },
    },
  );

  const { docs: questionDocs } = await responseQs.json();
  console.log("@init", questionDocs);

  console.log(`Found ${questionDocs.length} questions to add.`);

  for (let q of questionDocs) {
    q = { ...q, created_by: newUserId, question_group: q.question_group.id };
    console.log(`Updating question ${q.id}`);
    console.log(`Data ${JSON.stringify(q, null, 4)}`);

    const responseUs = await fetch(
      `http://private.dohaoasis.com/payload/api/employee-questions-new/${q.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${apiKey}`,
        },
        body: JSON.stringify(q),
      },
    );

    console.log("Response:", await responseUs.json());
  }
};

init();
