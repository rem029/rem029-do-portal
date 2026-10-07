import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

interface SuccessMessageFormProps {
  title?: string;
  subtitle?: string;
  icon?: JSX.Element;
  children?: JSX.Element;
  className?: string;
}

const SuccessMessageForm = ({
  title = "We Appreciate Your Input!",
  subtitle = "Thanks for taking the time to share your thoughts with us.",
  icon = <FaCheckCircle className="text-success text-8xl" />,
  children,
  className,
}: SuccessMessageFormProps) => {
  return (
    <motion.div
      className={`w-full h-screen flex flex-1 flex-col gap-6 items-center justify-center ${className}`}
      animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
      transition={{ ease: "easeOut", duration: 0.5, delay: 0.2 }}
    >
      <motion.p
        className="text-2xl font-bold !text-primary text-center"
        animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
        transition={{ ease: "easeOut", duration: 0.5, delay: 0.3 }}
      >
        {title}
      </motion.p>
      <motion.p
        className="text-md text-center"
        animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
        transition={{ ease: "easeOut", duration: 0.5, delay: 0.4 }}
      >
        {subtitle}
      </motion.p>
      {icon}
      {children}
    </motion.div>
  );
};

export default SuccessMessageForm;
