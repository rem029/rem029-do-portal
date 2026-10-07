interface CheckboxProp {
  label: string | JSX.Element;
  name: string;
  items: { label: string }[];
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const CheckboxGroup = (props: CheckboxProp) => {
  return (
    <div className="flex flex-col gap-2">
      {props.label}
      <div className="flex flex-row gap-4 max-md:flex-col">
        {props.items.map((i, index) => (
          <div className="form-control" key={props.name + index}>
            <label className="label cursor-pointer gap-4">
              <span className="label-text">{i.label}</span>
              <input
                type="checkbox"
                name={`${props.name}:${i.label}`}
                className="checkbox checkbox-primary"
                checked={i.label === props.value}
                onChange={props?.onChange}
                disabled={props.disabled}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
