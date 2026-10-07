import { ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = (): JSX.Element => {
  const [fields, setFields] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = () => {
    if (!fields.username || !fields.password) {
      return;
    }

    navigate("/login-success");
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div
        className={`card rounded-xl flex flex-col items-center justify-center gap-8 px-4 py-8 w-full border-gray-50 border-2 shadow-lg`}
      >
        <h6 className="w-full text-center">Login please</h6>
        <input
          type="text"
          name="username"
          placeholder="Username..."
          className="input input-ghost input-md input-primary w-full max-w-md"
          value={fields.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password..."
          className="input input-ghost input-md input-primary w-full max-w-md"
          value={fields.password}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="btn btn-primary w-full max-w-md text-white shadow-lg"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
