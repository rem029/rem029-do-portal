import { useLocation, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { getPageConfig, initDefaultLanguage } from "../../helpers";
import { Language } from "../../types";
import { t } from "../../utils/contents";

interface HeaderProps {
  logo?: {
    primary: string;
    secondary: string;
  };
}

export const Header = ({ logo }: HeaderProps) => {
  let { pathname } = useLocation();
  const [sParams] = useSearchParams();

  const lang: Language = useMemo(() => {
    return initDefaultLanguage(sParams?.get("lang") || "");

    // eslint-disable-next-line
  }, []);

  const header = getPageConfig(pathname);
  const {maxWidth} = header;

  return (
    <header className="w-screen max-md:px-4 px-2 max-md:py-4 p-8 h-min flex gap-4 justify-center items-center bg-neutral  shadow-md shadow-gray-100">
      <div className={`w-full ${maxWidth || 'max-w-6xl'} h-full flex flex:row justify-between items-center`}>
        <div className="flex flex-col gap-1">
          <h1
            className={`${header.headerFont} text-left text-primary opacity-80 text-md max-md:text-sm`}
          >
            {t(header.header, lang)}
          </h1>

          {logo?.secondary && (
            <img
              src={logo?.secondary}
              alt="logo-header"
              className="w-24 h-auto object-contain flex max-md:w-20"
            />
          )}
        </div>

        {logo?.primary && (
          <img
            src={logo?.primary}
            alt="logo-header"
            className="w-36 h-auto object-contain flex max-md:w-24"
          />
        )}
      </div>
    </header>
  );
};

export default Header;
