import { useEffect, useState } from "react";
import { generateArrayWithNumbers } from "../../../helpers";

const RatingScale = ({
  name,
  length = 3,
  onChange = (name, value) => {},
  value = 0,
}: RatingScaleProps) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    onChange(currentValue, name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  return (
    <div className="flex flex-1 flex-row justify-between">
      {generateArrayWithNumbers(length).map((num) => {
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              setCurrentValue(num);
            }}
            name={name}
            className={`btn btn-square btn-sm max-md:btn-xs ${
              currentValue === num ? "btn-primary" : "btn-outline btn-info"
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
};

interface RatingScaleProps {
  name?: string;
  length?: number;
  value?: number;
  onChange?: (value: number, name?: string) => void;
}

export default RatingScale;
