import axios from "axios";
import { useForm } from "payload/components/forms";
import { useConfig } from "payload/dist/admin/components/utilities/Config";
import React, { useState } from "react";

const EmailSettingsTest = () => {
  const [recipient, setRecipient] = useState("");
  const [testType, setTestType] = useState("email-settings");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { getFields } = useForm();
  const config = useConfig();

  const handleTestClick = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const fields = getFields();
    console.log(fields);
    try {
      setErrorMessage("");
      setSuccessMessage("");
      setLoading(true);
      if (!recipient) {
        throw new Error("No recipient entered.");
      }
      if (!testType) {
        throw new Error("Test type not selected");
      }

      const configs = {
        "email-settings": {
          title: "Test Email - Settings",
          data: {},
        },
        "email-careers-new": {
          title: "Test Email - New Application for Application Testing",
          data: {
            url: `${config.serverURL}${config.routes.admin}/collections/careers-application-printemps/d36063be-7d50-4666-8d5b-116021e1cbd6`,
            careerTitle: "Application Testing",
          },
        },
        "email-careers-applicant": {
          title: "Test Email - Application Acknowledgement for Application Testing",
          data: {
            operator: "Doha Oasis",
            careerTitle: "Application Testing",
          },
        },
      };

      await axios({
        method: "post",
        url: `${config.routes.api}/email/send/v2/careers`,
        data: {
          title: configs[testType].title,
          to: recipient,
          args: {
            ...configs[testType].data,
            template: testType,
          },
        },
      });

      setSuccessMessage("Sent.");
    } catch (error) {
      setErrorMessage((error as Error).message);
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg">Email Test</h6>

      <input
        type="email"
        name="recipient"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient email for test"
        className="w-full max-w-md py-2 text-sm"
        disabled={loading}
      />
      <select
        name="test-type"
        className="w-full max-w-md py-2 text-sm"
        value={testType}
        onChange={(e) => setTestType(e.target.value)}
        disabled={loading}
      >
        <option value="email-settings">Email Test</option>
        <option value="email-careers-new">Careers New Alert</option>
        <option value="email-careers-applicant">Applicant Response</option>
      </select>
      <button
        className="py-4 px-8 w-full max-w-md"
        onClick={handleTestClick}
        disabled={loading}
      >
        Test Email Settings
      </button>
      {successMessage && (
        <span className="text-sm text-green-500">{successMessage}</span>
      )}
      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}
    </div>
  );
};

export default EmailSettingsTest;
