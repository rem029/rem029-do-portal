import { ControlProps, OptionProps } from "react-select";
import { CountryOption } from "../../../helpers";

export const CountrySingleValue = ({ data }: { data: CountryOption }) => (
  <div className="flex w-full flex-row gap-1 items-center justify-between absolute px-1">
    <span className="font-Noto-Color-Emoji text-xs">{data.emoji}</span>
    <span className="font-Urbanist text-xs w-full flex-1">{data.label}</span>
  </div>
);

export const CountrySelectOption = (props: OptionProps<CountryOption>) => {
  const { data, innerRef, innerProps } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="flex flex-row gap-1 items-center justify-between p-2 hover:bg-gray-100"
    >
      <span className="font-Noto-Color-Emoji text-xs">{data.emoji}</span>
      <span className="font-Urbanist text-xs w-full">{data.label}</span>
    </div>
  );
};

export const CountryControl = (props: ControlProps<CountryOption>) => {
  const { innerRef, innerProps, children } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={`flex flex-1 items-center justify-start text-xs input input-sm input-ghost border-b-2 border-b-primary rounded-none w-full max-md:input-sm`}
    >
      {children}
    </div>
  );
};
