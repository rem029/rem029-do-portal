import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const Card = ({
  children,
  animate = false,
  elevate = false,
  animateDelay,
  bgClassName = "bg-transparent",
}: CustomerSurveyCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      animate={
        animate ? (isInView ? { opacity: [0, 0.2, 1], x: [200, 0] } : {}) : {}
      }
      transition={{ ease: "easeOut", duration: 0.3, delay: animateDelay }}
      className={`${bgClassName}  card rounded-md flex flex-col gap-4 px-2 py-2 w-full ${
        elevate ? "drop-shadow-md" : ""
      }
      
      `}
    >
      {children}
    </motion.div>
  );
};

export const CardTitle = ({ icon, title, hasDivider = true }: CardTitleProps) => {
  return (
    <div className="flex flex-col gap-2 pb-2">
      <h6 className="text-[16px] text-primary inline-flex gap-2 items-center">
        {icon}
        {title}
      </h6>
      {hasDivider && <div className="h-[1px] w-full bg-primary opacity-50" />}
    </div>
  );
};

interface CardTitleProps {
  title?: string | JSX.Element;
  icon?: JSX.Element;
  hasDivider?: boolean;
}

interface CustomerSurveyCardProps {
  animate?: boolean;
  animateDelay?: number;
  elevate?: boolean;
  children: JSX.Element | JSX.Element[];
  bgClassName?: "bg-transparent" | "bg-gray-50";
}

export default Card;
