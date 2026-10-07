const emails = [
  "zeina.nassar@dohaoasis.com",
  "wassim.darwiche@dohaoasis.com",
  "morteza.takhti@dohaoasis.com",
  "Abbas.Hussain@dohaoasis.com",
  "razan.alaa@dohaoasis.com",
  "rinesh.nanu@dohaoasis.com",
  "usman.khan@dohaoasis.com",
  "rejin.ramanan@dohaoasis.com",
  "ronaldo.parlan@dohaoasis.com",
  "moiz.shaikh@dohaoasis.com",
  "piratheepan.lingam@dohaoasis.com",
  "asil.ismail@dohaoasis.com",
  "mehrez.meliani@dohaoasis.com",
  "richard.sayson@dohaoasis.com",
  "aabid@printempsdoha.com",
  "bateena.alqubaj@dohaoasis.com",
  "mohammad.salman@dohaoasis.com",
  "fadi.attar@dohaoasis.com",
  "muhammad.mauroof@dohaoasis.com",
  "muhammad.imran@dohaoasis.com",
  "dana.elnamly@dohaoasis.com",
  "christina.khaled@dohaoasis.com",
  "nour.hanoun@dohaoasis.com",
  "Kemematt@yahoo.com",
  "otarga@dohaquest.com",
  "mangala.jay@dohaoasis.com",
  "milroy.fernando@dohaoasis.com",
  "sputhiyapurayil@printempsdoha.com",
  "yannick.fernando@dohaoasis.com",
  "natthijadav@gmail.com",
  "Ammar.Albishara@dohaoasis.com",
  "Hariharan@dohaoasis.com",
  "allan.solomon@dohaoasis.com",
  "mlopes@printempsdoha.com",
  "jomar.peralta@dohaoasis.com",
  "thubindra.sangraram@dohaoasis.com",  
  "kaja.mohideen@dohaoasis.com",
  "donavan.cabantac@dohaoasis.com",
  "sarab.zourob@dohaoasis.com"
];


const init = async () => {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const apiKey = args[0]; // The first argument will be the API key

  if (!apiKey) {
    console.error("Error: API key is required. Usage: node add_emp.js YOUR_API_KEY");
    process.exit(1); // Exit if no API key is provided
  }
  console.log(`Found ${emails.length} records to add.`);

  for (const email of emails) {
    console.log(`Adding record ${email}`);
    try {
      const response = await fetch(
        "https://public.dohaoasis.com/payload/api/employee-perks-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `users API-Key ${apiKey}`,
          },
          body: JSON.stringify({email: email, password:email}),
        },
      );
  
      console.log("Response:", await response.json());
    } catch (error) {
      console.error(`Error adding record for ${email}:`, error);
    }
   
  }
};

init();
