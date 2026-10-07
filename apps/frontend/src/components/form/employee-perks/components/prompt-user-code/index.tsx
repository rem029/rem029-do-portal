import { useState } from "react";
import usePayload from "../../../../../hooks/use-payload";
import { EmployeePerksUser } from "../../../../../types/payload-types";
import { useNavigate } from "react-router-dom";

export interface PromptUserCodeProps {
  logoUrl?: string;
}

const PromptUserCode = ({ logoUrl }: PromptUserCodeProps) => {
  const [userCode, setUserCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { fetch: userInfosFetch } = usePayload<EmployeePerksUser[]>("collections", {
    slug: "employee-perks-users",
    fetchOnLoad: false,
  });

  const handleSubmit = async () => {
    if (!userCode.trim()) return;
    try {
      setLoading(true);

      const users = await userInfosFetch(`where[user_code][equals]=${userCode}`);

      if (users && users.length > 0) {
        const userInfo = users[0];
        if (userInfo) {
          navigate(`/employee/perks?user=${userCode}`);
          window.location.reload();
        }
      } else {
        alert("Invalid user code. Please try again");
      }
    } catch (_) {
      alert("Something went wrong. Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh px-2 py-6 flex flex-col gap-6 justify-center items-center">
      {logoUrl && (
        <img className="employee-perks__logo" src={logoUrl} alt="dohaoasis-logo" />
      )}

      <p className="w-full text-center">
        User code is required to access this page.
      </p>

      <input
        disabled={loading}
        className="input input-sm input-ghost input-info w-full max-w-xs text-center"
        type="text"
        name="userCode"
        placeholder="Please enter your user code."
        value={userCode}
        onChange={(e) => setUserCode(e.target.value)}
      />

      <button
        disabled={loading || !userCode}
        onClick={handleSubmit}
        className="employee-perks__button-primary"
      >
        Submit
      </button>
    </div>
  );
};

export default PromptUserCode;
