import React from "react";

interface ErrorPageProps {
  message?: string | React.ReactNode;
}
const ErrorPage = ({ message }: ErrorPageProps) => {
  return (
    <div className="w-full h-screen flex flex-col gap-4 items-center justify-center">
      <h3 className="text-2xl font-bold">Not Found 🙊</h3>

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default ErrorPage;
