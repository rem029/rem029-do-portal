import { motion } from "framer-motion";

const ClubprintempsPage = () => {
  return (
    <div className="w-full h-full flex flex-1 gap-8 flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: [0, 90, 180, 270, 360] }}
        transition={{
          duration: 50,
          ease: "linear",
          repeat: Infinity,
        }}
        className="w-max h-auto object-contain flex"
      >
        <img
          src="/assets/printemps-club-logo.png"
          alt="printemps-club-logo"
          className="w-48 h-auto object-contain flex"
        />
      </motion.div>
      <div className="w-full h-max flex flex-col gap-1">
        <motion.p
          className="text-primary text-xl text-center"
          animate={{ opacity: [0, 0.2, 1], y: [100, 0] }}
          transition={{ ease: "easeOut", duration: 0.3, delay: 0.2, type: "spring" }}
        >
          Printemps Loyalty Club App Launched!
        </motion.p>
        <motion.p
          className="text-info text-md text-center"
          animate={{ opacity: [0, 0.2, 1], y: [100, 0] }}
          transition={{ ease: "easeOut", duration: 0.3, delay: 0.2, type: "spring" }}
        >
          Download now to start enjoying exclusive member benefits.
        </motion.p>
      </div>

      <motion.div
        animate={{ opacity: [0, 0.2, 1], y: [100, 0] }}
        transition={{ ease: "easeOut", duration: 0.3, delay: 0.3, type: "spring" }}
        className="w-full flex flex-row flex-wrap items-center justify-center gap-1"
      >
        <a
          className="w-60 max-w-80 p-0"
          href="https://play.google.com/store/apps/details?id=com.printemps.clubprintemps&pli=1&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"
        >
          <img
            className="w-60 max-w-80"
            alt="Get it on Google Play"
            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
          />
        </a>
        <a
          className="w-60 max-w-80 p-0"
          href={`https://apps.apple.com/us/app/club-printemps/id6477400369?itsct=apps_box_badge&amp;itscg=30200`}
        >
          <img
            className="w-60 max-w-80 p-5"
            src={`https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1712620800`}
            alt="Download on the App Store"
          />
        </a>
      </motion.div>
    </div>
  );
};

export default ClubprintempsPage;
