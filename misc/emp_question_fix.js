const init = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // The first argument will be the API key

  if (!apiKey) {
    console.error("Error: API key is required. Usage: node fix_emp.js YOUR_API_KEY");
    process.exit(1); // Exit if no API key is provided
  }

  const resGetQuestions = await fetch(
    "http://private.dohaoasis.com/payload/api/employee-questions-new?limit=1000000&sort=id",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `users API-Key ${apiKey}`,
      },
    },
  );

  if (!resGetQuestions.ok) {
    throw new Error(
      `Fetching employee questions error! Status: ${resGetQuestions.status}`,
    );
  }

  const resGetEmpResponses = await fetch(
    "http://private.dohaoasis.com/payload/api/employee-responses?limit=1000000&sort=id",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `users API-Key ${apiKey}`,
      },
    },
  );

  if (!resGetEmpResponses.ok) {
    throw new Error(
      `Fetching employee questions error! Status: ${resGetEmpResponses.status}`,
    );
  }

  const dataEmpQuestion = await resGetQuestions.json();
  const dataEmpResponses = await resGetEmpResponses.json();

  const { docs: dataEmpQuestionDocs } = dataEmpQuestion;
  const { docs: dataEmpResponsesDocs } = dataEmpResponses;

  for (let doc of dataEmpResponsesDocs) {
    let updatedQuestions = [];
    // Loop main document
    let qIndex = 0;

    for (const question of doc.questions) {
      // Loop questions inside document
      updatedQuestions = [
        ...updatedQuestions,
        { ...question, question: dataEmpQuestionDocs[qIndex].id },
      ];
      qIndex++;
    }

    // Assign updated questions
    doc.questions = updatedQuestions;
    console.log(
      "Updating doc",
      `http://private.dohaoasis.com/payload/api/employee-responses/${doc.id}`,
    );
    // Update emp response
    const resPatchEmpResponse = await fetch(
      `http://private.dohaoasis.com/payload/api/employee-responses/${doc.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${apiKey}`,
        },
        body: JSON.stringify(doc),
      },
    );
    console.log("Response: ", await resPatchEmpResponse.text());
    // const resPatchEmpResponseData = await resPatchEmpResponse.json();
  }
};

init();
