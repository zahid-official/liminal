import { Link } from "react-router-dom";
import image3 from "/assets/image3.jpeg";
import image4 from "/assets/image4.jpeg";
import image5 from "/assets/image5.jpeg";

import { motion } from "motion/react";

const Studio = () => {
  return (
    <div className="lg:py-24 sm:py-10 py-4 px-6">
      <div className="grid lg:grid-cols-12 gap-10 overflow-hidden">
        {/* left */}
        <motion.div
          initial={{ translateX: -200, opacity: 0 }}
          whileInView={{ translateX: 0, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.2 }}
          className="lg:col-span-3 flex lg:flex-col gap-8 sm:flex-row flex-col lg:items-start lg:justify-start items-center justify-center"
        >
          <div className="">
            <Link to={"/about"}>
              <img src={image3} className="h-full"></img>
            </Link>
          </div>
          <div className="text-5xl w-full lg:text-right text-center font-extralight ">
            <Link to={"/about"}>Our Team</Link>
          </div>
        </motion.div>

        {/* middle */}
        <motion.div
          initial={{ translateY: 200, opacity: 0 }}
          whileInView={{ translateY: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:col-span-6"
        >
          <img src={image4}></img>
        </motion.div>

        {/* right */}
        <motion.div
          initial={{ translateX: 200, opacity: 0 }}
          whileInView={{ translateX: 0, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.2 }}
          className="lg:col-span-3 flex lg:flex-col gap-8 sm:flex-row flex-col lg:items-end lg:justify-end  items-center justify-center"
        >
          <div className="text-5xl w-full lg:text-left text-center font-extralight">
            <Link to={"/about"}>Our Studio</Link>
          </div>
          <div>
            <Link to={"/about"}>
              <img src={image5}></img>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Studio;
