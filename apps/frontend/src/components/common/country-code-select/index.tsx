import { ControlProps, OptionProps } from "react-select";
import { CountryOption } from "../../../helpers";

export const CountryCodeSingleValue = ({ data }: { data: CountryOption }) => (
  <div className="flex w-full flex-row gap-1 items-center justify-between absolute px-1 ">
    <span className="font-Noto-Color-Emoji text-xs">{data.emoji}</span>
    <span className="font-Urbanist text-xs w-full flex-1">{data.value}</span>
    <span className="font-Urbanist text-[10px] text-info leading-tight">
      {data.phone.join(", ")}
    </span>
  </div>
);

export const CountryCodeCustomOption = (props: OptionProps<CountryOption>) => {
  const { data, innerRef, innerProps } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="flex flex-row gap-1 items-center p-2 hover:bg-gray-100s"
    >
      <span className="font-Noto-Color-Emoji text-xs">{data.emoji}</span>
      <span className="font-Urbanist text-xs w-full">{data.label}</span>
      <span className="font-Urbanist text-[10px] text-info">
        {data.phone.join(", ")}
      </span>
    </div>
  );
};

export const CountryCodeControlOption = (props: ControlProps<CountryOption>) => {
  const { innerRef, innerProps, children } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={`flex flex-1 items-center justify-start text-xs input input-sm input-ghost border-b-2 border-b-primary rounded-none w-full max-md:input-sm bg-white`}
    >
      {children}
    </div>
  );
};
