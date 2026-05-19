// "use client";
// import { FaLaptopCode, FaMobileAlt, FaCode, FaPalette, FaBullhorn, FaBrush } from "react-icons/fa";
// import { SiGoogleanalytics } from "react-icons/si";
// import Testimonials from "@/components/HomeComponents/Testimonial";
// import Link from "next/link";
// import Image from "next/image";
// import { motion } from "framer-motion";
// export default function ServicesPage() {
//   // Services Data with href
//   const services = [
//     { name: "Web Development", icon: <FaLaptopCode size={32} />, desc: "Crafting high-performance, visually stunning websites tailored for your business.", href: "/services/web-development" },
//     { name: "App Development", icon: <FaMobileAlt size={32} />, desc: "Building intuitive, scalable, and engaging mobile app experiences for businesses.", href: "/services/app-development" },
//     { name: "Software Development", icon: <FaCode size={32} />, desc: "Custom software solutions engineered to streamline operations and drive growth.", href: "/services/software-development" },
//     { name: "UI/UX Design", icon: <FaPalette size={32} />, desc: "Designing sleek, user-focused interfaces that enhance experience and usability.", href: "/services/ui-ux-design" },
//     { name: "Digital Marketing", icon: <FaBullhorn size={32} />, desc: "Boosting brand visibility and engagement through strategic online campaigns.", href: "/services/digital-marketing" },
//     { name: "Graphic Design", icon: <FaBrush size={32} />, desc: "Transforming ideas into powerful, captivating visuals that leave a lasting impression.", href: "/services/graphic-design" },
//     { name: "Research & Analytics", icon: <SiGoogleanalytics size={32} />, desc: "Delivering data-driven insights to fuel smarter decisions and business innovation.", href: "/services/research-and-analytics" },
//   ];
// const ServiceCardSketch = ({ icon, title, desc, href }) => (
//   <div className="relative group bg-gradient-to-br from-[#0b223f]/70 to-[#06263f]/50 border border-white/10 rounded-2xl overflow-visible shadow-lg transition duration-300 mt-6 hover:shadow-[0_0_30px_rgba(0,150,255,0.5)] min-h-[160px]">
//     {/* Icon Circle */}
//     <div className="absolute -top-10 -left-2 w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border-4 border-cyan-800 shadow-lg transition-transform duration-300 group-hover:scale-105">
//       <div className="text-cyan-400 transition-transform duration-300 group-hover:scale-125">
//         {icon}
//       </div>
//     </div>

//     {/* Main Card Content */}
//     <div className="p-6 ">
//       <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
//       <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
//     </div>

//     {/* Bottom-right Arrow (Link) */}


// <motion.div
//   className="relative"
//   whileHover={{ x: 16 }}
//   transition={{ type: 'spring', stiffness: 400, damping: 17 }}
// >
//   <Link href={href} className="block">
//     <motion.div
//       className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full overflow-hidden cursor-pointer"
//       whileHover={{ scale: 1.15 }}
//       transition={{ duration: 0.3 }}
//     >
//       {/* Blurred Background Layer */}
//       <motion.div
//         className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
//         initial={{ backdropFilter: 'blur(0px)' }}
//         whileHover={{ backdropFilter: 'blur(12px)' }}
//         transition={{ duration: 0.4, ease: 'easeOut' }}
//         style={{ zIndex: -1 }}
//       />

//       {/* Main SVG Icon */}
//       <motion.svg
//         className="relative z-10 w-full h-full text-cyan-400 p-2"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.5"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         whileHover={{
//           backgroundColor: 'rgba(34, 211, 238, 0.25)',
//           borderColor: '#22d3ee',
//           boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
//         }}
//       >
//         <path d="M5 12h14m-7-7l7 7-7 7" />
//       </motion.svg>

//       {/* Optional: Glass border ring */}
//       <motion.div
//         className="absolute inset-0 rounded-full border-2 border-cyan-800"
//         whileHover={{ borderColor: '#22d3ee' }}
//       />
//     </motion.div>
//   </Link>
// </motion.div>
//   </div>
// );


//   return (
//     <main className="bg-black text-white lg:pt-10 px-6 pt-20 pb-5">
//       <div className="max-w-7xl mx-auto">
//         {/* Hero Section */}
//         <div className="grid lg:grid-cols-2 items-center gap-10 relative bg-black/10 rounded-2xl shadow-lg">
//           <section className="flex flex-col gap-4 lg:text-left text-center">
//             <h1 className="text-4xl lg:text-5xl font-bold">
//               We Build <span className="text-cyan-400">Brands</span> <br />
//               That <span className="text-cyan-400">Stand Out</span>
//             </h1>
//             <p className="text-gray-400 max-w-2xl mb-8">
//               Our Professional Services will Ensure that Your Business Stands Out among the Vast Space of Competitors in the Internet.
//             </p>
//             <div className="flex flex-row gap-4 justify-center lg:justify-start">
//               <a
//                 href="https://calendly.com/banerjeedip761/consultancy-meet"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <button className="bg-cyan-500 text-black px-6 py-3 rounded-full font-medium hover:bg-cyan-400 transition cursor-pointer lg:text-lg text-sm">
//                   Book a Free Consultancy
//                 </button>
//               </a>

//               <Link
//                 href="/contact-us"
//                 className="border border-cyan-500 text-cyan-400 px-6 py-3 rounded-full font-medium hover:bg-cyan-500 hover:text-black transition lg:text-lg text-sm"
//               >
//                 Get a Free Quote
//               </Link>
//             </div>
//           </section>

//           {/* Logo with Glow */}
//           <div className="relative w-full h-80 lg:h-96 grid place-items-center">
//             <div className="absolute w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-r from-white via-cyan-400 to-cyan-600 blur-3xl opacity-80 animate-pulseGlow"></div>
//             <div className="relative w-32 h-32 lg:w-40 lg:h-40 bg-black border border-gray-700 rounded-full flex items-center justify-center">
//               <Image
//                 src="/logo2.png"
//                 alt="Logo"
//                 width={100}
//                 height={100}
//                 className="w-24 h-24 lg:w-28 lg:h-28 object-contain"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Our Services Section */}
//         <section className="pt-10 pb-20">
//           <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
//             Our <span className="text-cyan-400">Services</span>
//           </h2>

         
//          {/* First 4 cards */}
// <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto justify-center px-6 lg:px-0">
//   {services.slice(0, 4).map((service, index) => (
//     <div key={index} className="relative w-full h-full max-w-[300px] ">
     
//       {/* Service Card */}
//       <ServiceCardSketch
//         icon={service.icon}
//         title={service.name}
//         desc={service.desc}
//         href={service.href}
//       />
//     </div>
//   ))}
// </div>


//           {/* Centered 3 cards */}
//           <div className="mt-12 flex lg:flex-row flex-col justify-center gap-10 lg:max-w-5xl mx-auto px-6">
//             {services.slice(4).map((service, index) => (
//               <div key={index + 4} className="w-full h-full max-w-[300px] ">
//                 <ServiceCardSketch
//                   icon={service.icon}
//                   title={service.name}
//                   desc={service.desc}
//                   href={service.href}
//                 />
//               </div>
//             ))}
//           </div>
//         </section>

//         <Testimonials />
//       </div>
//     </main>
//   );
// }
"use client";
import { FaLaptopCode, FaMobileAlt, FaCode, FaPalette, FaBullhorn, FaBrush, FaBrain } from "react-icons/fa";
import { SiGoogleanalytics } from "react-icons/si";
import Testimonials from "@/components/HomeComponents/Testimonial";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ServicesPage() {
  // ✅ AI & Intelligent Systems added as FIRST service
  const services = [
    { name: "AI & Intelligent Systems", icon: <FaBrain size={32} />, desc: "Unlocking AI power through intelligent automation, machine learning, and large language models.", href: "/services/ai-intelligent-systems" },
    { name: "Web Development", icon: <FaLaptopCode size={32} />, desc: "Crafting high-performance, visually stunning websites tailored for your business.", href: "/services/web-development" },
    { name: "App Development", icon: <FaMobileAlt size={32} />, desc: "Building intuitive, scalable, and engaging mobile app experiences for businesses.", href: "/services/app-development" },
    { name: "Software Development", icon: <FaCode size={32} />, desc: "Custom software solutions engineered to streamline operations and drive growth.", href: "/services/software-development" },
    { name: "UI/UX Design", icon: <FaPalette size={32} />, desc: "Designing sleek, user-focused interfaces that enhance experience and usability.", href: "/services/ui-ux-design" },
    { name: "Graphic Design", icon: <FaBrush size={32} />, desc: "Transforming ideas into powerful, captivating visuals that leave a lasting impression.", href: "/services/graphic-design" },
    { name: "Digital Marketing", icon: <FaBullhorn size={32} />, desc: "Boosting brand visibility and engagement through strategic online campaigns.", href: "/services/digital-marketing" },
    { name: "Research & Analytics", icon: <SiGoogleanalytics size={32} />, desc: "Delivering data-driven insights to fuel smarter decisions and business innovation.", href: "/services/research-and-analytics" },
  ];

  const ServiceCardSketch = ({ icon, title, desc, href }) => (
    <div className="relative group bg-gradient-to-br from-[#0b223f]/70 to-[#06263f]/50 border border-white/10 rounded-2xl overflow-visible shadow-lg transition duration-300 mt-6 hover:shadow-[0_0_30px_rgba(0,150,255,0.5)] min-h-[160px]">
      {/* Icon Circle */}
      <div className="absolute -top-10 -left-2 w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border-4 border-cyan-800 shadow-lg transition-transform duration-300 group-hover:scale-105">
        <div className="text-cyan-400 transition-transform duration-300 group-hover:scale-125">
          {icon}
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>

      {/* Bottom-right Arrow (Link) */}
      <motion.div
        className="relative"
        whileHover={{ x: 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Link href={href} className="block">
          <motion.div
            className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
              initial={{ backdropFilter: "blur(0px)" }}
              whileHover={{ backdropFilter: "blur(12px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ zIndex: -1 }}
            />
            <motion.svg
              className="relative z-10 w-full h-full text-cyan-400 p-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              whileHover={{
                backgroundColor: "rgba(34, 211, 238, 0.25)",
                borderColor: "#22d3ee",
                boxShadow: "0 0 20px rgba(34, 211, 238, 0.6)",
              }}
            >
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </motion.svg>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-800"
              whileHover={{ borderColor: "#22d3ee" }}
            />
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );

  return (
    <main className="bg-black text-white lg:pt-10 px-6 pt-20 pb-5">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 items-center gap-10 relative bg-black/10 rounded-2xl shadow-lg">
          <section className="flex flex-col gap-4 lg:text-left text-center">
            <h1 className="text-4xl lg:text-5xl font-bold">
              We Build <span className="text-cyan-400">Brands</span> <br />
              That <span className="text-cyan-400">Stand Out</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mb-8">
              Our Professional Services will Ensure that Your Business Stands Out among the Vast Space of Competitors in the Internet.
            </p>
            <div className="flex flex-row gap-4 justify-center lg:justify-start">
              <a
                href="https://calendly.com/banerjeedip761/consultancy-meet"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="bg-cyan-500 text-black px-6 py-3 rounded-full font-medium hover:bg-cyan-400 transition cursor-pointer lg:text-lg text-sm">
                  Book a Free Consultancy
                </button>
              </a>
              <Link
                href="/contact-us"
                className="border border-cyan-500 text-cyan-400 px-6 py-3 rounded-full font-medium hover:bg-cyan-500 hover:text-black transition lg:text-lg text-sm"
              >
                Get a Free Quote
              </Link>
            </div>
          </section>

          {/* Logo with Glow */}
          <div className="relative w-full h-80 lg:h-96 grid place-items-center">
            <div className="absolute w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-r from-white via-cyan-400 to-cyan-600 blur-3xl opacity-80 animate-pulseGlow"></div>
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 bg-black border border-gray-700 rounded-full flex items-center justify-center">
              <Image
                src="/logo2.png"
                alt="Logo"
                width={100}
                height={100}
                className="w-24 h-24 lg:w-28 lg:h-28 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Our Services Section */}
        <section className="pt-10 pb-20">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
            Our <span className="text-cyan-400">Services</span>
          </h2>

          {/* ✅ First 4 cards: AI, Web, App, Software */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto justify-center px-6 lg:px-0">
            {services.slice(0, 4).map((service, index) => (
              <div key={index} className="relative w-full h-full max-w-[300px]">
                <ServiceCardSketch
                  icon={service.icon}
                  title={service.name}
                  desc={service.desc}
                  href={service.href}
                />
              </div>
            ))}
          </div>

          {/* ✅ Bottom 4 cards: UI/UX, Digital Marketing, Graphic Design, Research */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto px-6 lg:px-0">
            {services.slice(4).map((service, index) => (
              <div key={index + 4} className="w-full h-full max-w-[300px]">
                <ServiceCardSketch
                  icon={service.icon}
                  title={service.name}
                  desc={service.desc}
                  href={service.href}
                />
              </div>
            ))}
          </div>
        </section>

        <Testimonials />
      </div>
    </main>
  );
}