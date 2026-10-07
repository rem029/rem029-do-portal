import { Link, useLocation, Outlet, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSkiing, FaChevronRight } from "react-icons/fa";
import { GiWhirlwind } from "react-icons/gi";
import { Language } from "../../../types";
import { t } from "../../../utils/contents";

const WaiverForms = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const language = (searchParams.get("lang") as Language) || "en";

  const isIndex = location.pathname === "/dohaquest" || location.pathname === "/dohaquest/";

  if (!isIndex) return <Outlet />;

  const forms = [
    {
      title: "iFly Waiver Form",
      path: "ifly-waiver",
      icon: <GiWhirlwind />,
    },
    // {
    //   title: "Laser Oasis Waiver Form",
    //   path: "laser-oasis-waiver",
    //   icon: <GiLaserPrecision />,
    // },
    // {
    //   title: "Roller Skating Waiver Form",
    //   path: "roller-skating-waiver",
    //   icon: <FaSkating />,
    // },
    {
      title: "Ski Waiver Form",
      path: "ski-waiver",
      icon: <FaSkiing />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center py-10 px-4"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <img src="/assets/quest-logo-header.png" alt="Quest Logo" className="w-32 h-auto object-contain" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-6 w-full max-w-lg"
      >
        <h1 className="text-3xl font-extrabold text-primary uppercase tracking-wider mb-2">
          {t("Waiver Forms", language)}
        </h1>
        <p className="text-gray-400 text-sm font-medium">
          {t("Please select the activity you are participating in", language)}
        </p>
      </motion.div>

      <div className="divider w-full max-w-lg before:bg-primary/10 after:bg-primary/10 mb-8 mx-auto" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg flex flex-col gap-4"
      >
        {forms.map((form) => (
          <motion.div key={form.path} variants={itemVariants}>
            <Link
              to={`${form.path}?lang=${language}`}
              className="btn btn-primary h-24 w-full flex justify-between items-center group relative overflow-hidden rounded-2xl border-none shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Icon Section */}
              <div className="flex items-center gap-6 z-10">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-3xl text-secondary transition-transform group-hover:scale-110">
                  {form.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xl font-bold text-white uppercase tracking-tight">
                    {t(form.title, language)}
                  </span>
                  <span className="text-[10px] text-white/60 font-semibold uppercase tracking-widest mt-0.5">
                    {t("Click to open", language)}
                  </span>
                </div>
              </div>

              {/* Action Section */}
              <div
                className={`z-10 bg-secondary/20 p-2 rounded-full text-secondary transition-all duration-300 group-hover:bg-secondary group-hover:text-primary ${language === "ar" ? "rotate-180" : ""}`}
              >
                <FaChevronRight className="text-xl" />
              </div>

              {/* Decorative background accent */}
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-[-20deg] translate-x-10 group-hover:translate-x-0 transition-transform duration-700" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em]"
      >
        <p>© {new Date().getFullYear()} Doha Quest</p>
      </motion.div>
    </div>
  );
};

export default WaiverForms;
