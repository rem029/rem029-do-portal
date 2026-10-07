import { useLocation } from "react-router-dom";

interface NavigationProps {
  atHomepage?: boolean;
}

const Navigation = ({ atHomepage = false }: NavigationProps): JSX.Element => {
  const { pathname } = useLocation();
  return (
    <div
      className={`navbar flex  w-full h-fit gap-4 items-center justify-center ${
        atHomepage ? "flex-col" : "flex-row"
      }`}
    >
      {!atHomepage && (
        <>
          <a
            href="/net-promoter"
            className={`btn   btn-md flex-1 ${
              pathname.includes("/net-promoter") ? "btn-primary" : "btn-ghost"
            }`}
          >
            Net Promoter
          </a>
          <a
            href="/customer-survey"
            className={`btn  btn-md   flex-1 ${
              pathname.includes("/customer-survey")
                ? "btn-primary"
                : "btn-ghost"
            }`}
          >
            Customer Survey
          </a>
        </>
      )}
      {atHomepage && (
        <>
          <a
            href="/net-promoter"
            className={`btn btn-lg flex-1 btn-primary text-white min-w-96 max-md:w-full`}
          >
            Net Promoter
          </a>
          <a
            href="/customer-survey"
            className={`btn btn-lg flex-1 btn-primary text-white min-w-96 max-md:w-full`}
          >
            Customer Survey
          </a>
        </>
      )}
    </div>
  );
};

export default Navigation;
