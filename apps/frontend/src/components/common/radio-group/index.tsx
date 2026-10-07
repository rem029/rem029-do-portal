export interface RadioGroupProp {
  label: string | JSX.Element;
  name: string;
  direction: "flex-row" | "flex-col";
  items: {
    label: string | JSX.Element;
    icon?: string | JSX.Element;
    value: string;
  }[];
  spacing?: "dense" | "loose";
  value?: string;
  fullWidth?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeV2?: (value: string) => void;
  disabled?: boolean;
  unChecked?: { className?: string };
  checked?: { className?: string };
  className?: string;
}

export const RadioGroup = ({ spacing = "loose", ...props }: RadioGroupProp) => {
  return (
    <div
      className={`flex flex-col ${
        spacing === "loose" ? "gap-2" : ""
      } max-md:text-sm ${props.fullWidth ? "w-full" : "max-w-lg"} ${
        props?.className || ""
      }`}
    >
      {props.label}
      <div className={`flex ${props.direction} gap-4 flex-wrap`}>
        {props.items.map((i, index) => {
          const isChecked = props.value === i.value;
          const checkedClassName = props.checked?.className || "";
          const unCheckedClassName = props.unChecked?.className || "";

          return (
            <div
              key={props.name + index}
              className={`form-control px-1 py-[1px] box-border ${
                props.direction === "flex-row" ? "flex-auto" : "flex-1"
              } ${
                isChecked
                  ? `${checkedClassName} bg-primary text-white border-primary border-2 rounded-md border-opacity-80`
                  : `${unCheckedClassName} border-primary border-2 rounded-md border-opacity-50 bg-white`
              }`}
            >
              <label className="label cursor-pointer gap-4">
                <span
                  className={`label-text text-xs w-full text-center ${
                    isChecked ? "text-white font-bold" : "text-gray-500"
                  }`}
                >
                  {i.label} {i.icon}
                </span>
                <input
                  type="radio"
                  name={`${props.name}:${i.label}:${i.value}`}
                  className={`radio radio-mark radio-xs checked:bg-primary checkbox-primary`}
                  checked={isChecked}
                  onChange={(e) => {
                    if (props?.onChange) props?.onChange(e);
                    if (props?.onChangeV2) props?.onChangeV2(i.value);
                  }}
                  disabled={props.disabled}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadioGroup;
