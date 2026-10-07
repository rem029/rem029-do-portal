import { API_SURVEY_URL } from "../../../utils/constants";

const WaiverHeader = ({
  questlogoFileName,
  rideLogoFileName,
}: WaiverHeaderProps) => {
  return (
    <header className="w-full py-4 flex flex-row items-center justify-between max-md:py-1">
      <img
        src={`${API_SURVEY_URL}/media//${questlogoFileName}`}
        alt={questlogoFileName}
        className="w-24 h-auto object-contain flex max-md:w-16"
      />
      {rideLogoFileName && (
        <img
          src={`${API_SURVEY_URL}/media//${rideLogoFileName}`}
          alt={rideLogoFileName}
          className="w-24 h-auto object-contain flex max-md:w-16"
        />
      )}
    </header>
  );
};

interface WaiverHeaderProps {
  questlogoFileName: string;
  rideLogoFileName?: string;
}

export default WaiverHeader;
