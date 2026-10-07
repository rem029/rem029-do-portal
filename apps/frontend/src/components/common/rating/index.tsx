interface RatingProp {
  name: string;
  count: number;
  value: number;
  label?: string;
  labelColor?: string;
  valueLabel?: string;
  placholderText?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  variant?: "bg-primary" | "bg-secondary";
  className?: string;
}

export const Rating = ({
  placholderText = "Select rating",
  variant = "bg-primary",
  ...props
}: RatingProp) => {
  const border = variant === "bg-primary" ? "border-primary" : "border-secondary";
  const className = props?.className || "";

  return (
    <div
      className={`${className} flex flex-col gap-2 max-sm:flex-col max-md:gap-3 py-2 ${border} border-b-[1px] border-opacity-10`}
    >
      {props.label && (
        <span
          className={`label label-text min-w-[10rem] py-1 max-md:py-0 max-md:text-xs ${
            (props?.labelColor as string) || ""
          }`}
        >
          {props.label}
        </span>
      )}
      <div className="w-full flex flex-row max-md:flex-col gap-1">
        <span
          className={`label text-sm min-w-[10rem] flex-1 py-1 max-md:py-0 max-md:text-xs ${
            props.valueLabel ? "text-gray-500" : "text-gray-300"
          }`}
        >
          {props.valueLabel ? props.valueLabel : placholderText}
        </span>
        <div className="rating max-md:rating-md gap-4 justify-center items-center max-md:justify-start">
          {Array.from({ length: Number(props.count) }, (_, i) => i + 1).map((i) => {
            const isChecked = props.value === i;
            const hasValue = props.value > 0;
            return (
              <input
                key={props.name + i}
                type="radio"
                name={`${props.name}:${i}`}
                checked={isChecked}
                onChange={props.onChange}
                className={`mask mask-star-2  ${
                  hasValue ? variant : "bg-info bg-opacity-30"
                } `}
                disabled={props.disabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rating;
