// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaWhatsapp,
//   FaMapMarkerAlt,
//   FaLinkedin,
// } from "react-icons/fa";
// import logo from "../public/logo.png";

// const Footer = () => {
//   const currentYear = new Date().getFullYear();

//   return (
//     <footer className="bg-black text-white py-8 px-6 sm:px-6">
//       <div className="max-w-7xl mx-auto bg-gradient-to-r from-cyan-400 via-cyan-400/90 to-cyan-400/70 text-black rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col gap-8">
//         {/* Main Footer Content */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 text-center sm:text-left">
//           {/* Logo & About */}
//           <div className="flex flex-col items-center sm:items-start">
//             <Image
//               src={logo}
//               alt="logo"
//               width={120}
//               height={120}
//               className="cursor-pointer w-24 sm:w-32 md:w-36"
//             />
//             <p className="mt-3 text-slate-900 leading-relaxed text-sm sm:text-base max-w-[220px] sm:max-w-[250px]">
//              Discover endless possibilities in the{" "}
//               <span className="font-semibold text-black">Cyber-space</span>
//             </p>
//           </div>

//           {/* Useful Links */}
// <div>
//   <h3 className="text-base sm:text-lg font-semibold mb-3 text-black">
//     Useful Links
//   </h3>
//   <ul className="space-y-2 text-slate-900 text-sm sm:text-base">
//     {[
//       { href: "/", label: "Home" },
//       { href: "/services", label: "Services" },
//       { href: "/about-us", label: "About Us" },
//       { href: "/contact-us", label: "Contact Us" },
//       { href: "/privacy-policy", label: "Privacy Policy" },
//       { href: "/terms-and-conditions", label: "Terms & Conditions" },
//       { href: "/faq", label: "FAQ" },
//     ].map((link) => (
//       <li key={link.href}>
//         <Link
//           href={link.href}
//           className="relative hover:text-slate-700 transition duration-200 after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-slate-700 after:transition-all after:duration-300 hover:after:w-full"
//         >
//           {link.label}
//         </Link>
//       </li>
//     ))}
//   </ul>
// </div>

// {/* Services */}
// <div>
//   <h3 className="text-base sm:text-lg font-semibold mb-3 text-black">
//     Services
//   </h3>
//   <ul className="space-y-2 text-slate-900 text-sm sm:text-base">
//     {[
//       { href: "/services/web-development", label: "Web Development" },
//       { href: "/services/app-development", label: "App Development" },
//       { href: "/services/software-development", label: "Software Development" },
//       { href: "/services/ui-ux-design", label: "UI/UX Design" },
//       { href: "/services/digital-marketing", label: "Digital Marketing" },
//       { href: "/services/graphic-design", label: "Graphic Design" },
//       { href: "/services/research-and-analytics", label: "Research and Analytics" },
//     ].map((item) => (
//       <li key={item.href}>
//         <Link
//           href={item.href}
//           className="
//             relative inline-block 
//             hover:text-slate-700 
//             transition 
//             duration-200
//             after:absolute 
//             after:left-0 
//             after:-bottom-0.5 
//             after:w-0 
//             after:h-[2px] 
//             after:bg-slate-700 
//             after:transition-all 
//             after:duration-300 
//             hover:after:w-full
//           "
//         >
//           {item.label}
//         </Link>
//       </li>
//     ))}
//   </ul>
// </div>

//           {/* Contact */}
//           <div>
//             <h3 className="text-base sm:text-lg font-semibold mb-3 text-black">
//               Get In Touch
//             </h3>
//             <p className="text-slate-900 text-sm sm:text-base">
//   <a
//     href="tel:+917980715765"
//     className="hover:text-slate-700 transition"
//   >
//     +91 7980715765
//   </a>
// </p>
// <p className="text-slate-900 text-sm sm:text-base">
//   <a
//     href="mailto:cyberspaceworksofficial@gmail.com"
//     className="hover:text-slate-700 transition"
//   >
//     cyberspaceworksofficial@gmail.com
//   </a>
// </p>

//             {/* Social Media Links */}
//             <div className="flex justify-center sm:justify-start space-x-4 mt-4 text-black text-lg sm:text-xl">
//               <a
//                 href="https://www.facebook.com/profile.php?id=100086774724799"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <FaFacebookF className="cursor-pointer hover:scale-110 transition" />
//               </a>
//               <a
//                 href="https://www.instagram.com/cyberspaceworks"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <FaInstagram className="cursor-pointer hover:scale-110 transition" />
//               </a>
//               <a
//                 href="https://wa.me/917980715765"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <FaWhatsapp className="cursor-pointer hover:scale-110 transition" />
//               </a>
//               <a
//                 href="https://www.google.com/maps/place/Cyberspace+Works+-+Website,+Software+and+App+Developer+in+Howrah,+Kolkata/@22.6434765,88.3408238,716m/data=!3m2!1e3!4b1!4m6!3m5!1s0x39f89dd56c959339:0x59f91e11a807e487!8m2!3d22.6434765!4d88.3433987!16s%2Fg%2F11tfxl7lfx?authuser=0&entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D" 
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <FaMapMarkerAlt className="cursor-pointer hover:scale-110 transition" />
//               </a>
//               <a
//                 href="https://www.linkedin.com/company/cyberspace-works"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <FaLinkedin className="cursor-pointer hover:scale-110 transition" />
//               </a>
//             </div>
//           </div>
//         </div>

//         {/* Bottom Text */}
//         <div className="text-center text-slate-900 text-xs sm:text-sm border-t border-gray-300/30 pt-4">
//           © {currentYear} Cyberspace Works. All Rights Reserved.
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaLinkedin,
  FaBrain,
  FaLaptopCode,
  FaMobileAlt,
  FaCode,
  FaPalette,
  FaBullhorn,
  FaBrush,
  FaShoppingBag,
} from "react-icons/fa";
import { SiGoogleanalytics } from "react-icons/si";
import { XMarkIcon } from "@heroicons/react/24/solid";
import logo from "../public/logo.png";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuoteModal } from "@/context/QuoteModalContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();
   const { status } = useSession();
    const isAuthenticated = status === "authenticated";
  const pathName=usePathname();
  const router = useRouter();
  
  // Use Quote Modal Context
  const {
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    currentStepIndex,
    setCurrentStepIndex,
    isComplete,
    setIsComplete,
    stepFormData,
    setStepFormData,
    stepError,
    setStepError,
    isSubmittingLead,
    setIsSubmittingLead,
    resetQuoteForm,
    openQuoteModal,
    closeQuoteModal,
  } = useQuoteModal();

  const quoteSteps = [
    { key: "name", label: "What is your name?", type: "text", placeholder: "Enter your full name" },
    { key: "email", label: "What is your email address? (optional)", type: "email", placeholder: "Enter your email" },
    { key: "phone", label: "What is your phone number?", type: "tel", placeholder: "Enter your phone number" },
    { key: "service", label: "Which service do you need?", type: "checkbox" },
    { key: "requirement", label: "Briefly describe your requirement", type: "text", placeholder: "Tell us about your project" },
    { key: "budget", label: "What is your budget?", type: "text", placeholder: "Enter your budget" },
  ];

  const services = [
    { name: "AI & Intelligent Systems", icon: <FaBrain />, subtext: "Automation, ML & LLM solutions", href: "/services/ai-intelligent-systems" },
    { name: "Web Development", icon: <FaLaptopCode />, subtext: "Custom, scalable web apps", href: "/services/web-development" },
    { name: "App Development", icon: <FaMobileAlt />, subtext: "iOS & Android native solutions", href: "/services/app-development" },
    { name: "Software Development", icon: <FaCode />, subtext: "Tailored enterprise solutions", href: "/services/software-development" },
    { name: "UI/UX Design", icon: <FaPalette />, subtext: "Designs that convert users", href: "/services/ui-ux-design" },
    { name: "Graphic Design", icon: <FaBrush />, subtext: "Creative branding visuals", href: "/services/graphic-design" },
    { name: "Digital Marketing", icon: <FaBullhorn />, subtext: "Boost your brand visibility", href: "/services/digital-marketing" },
    { name: "Research & Analytics", icon: <SiGoogleanalytics />, subtext: "Data-driven insights", href: "/services/research-and-analytics" },
  ];

  const validateStepValue = (key, value) => {
    if (key === "service") {
      if (!Array.isArray(value) || value.length === 0) {
        return "Please select at least one service.";
      }
      return "";
    }

    if (key === "email") {
      const trimmedValue = value.trim();
      if (!trimmedValue) return "";
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedValue)) return "Please enter a valid email address.";
      return "";
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) return "This field is required.";

    if (key === "phone") {
      const phonePattern = /^[0-9]{10,15}$/;
      if (!phonePattern.test(trimmedValue.replace(/\s+/g, ""))) {
        return "Please enter a valid phone number (10-15 digits).";
      }
    }

    return "";
  };

  const handleStepInputChange = (event) => {
    const { value } = event.target;
    const activeStep = quoteSteps[currentStepIndex];
    setStepFormData((prev) => ({ ...prev, [activeStep.key]: value }));
    if (stepError) setStepError("");
  };

  const handleServiceSelectionChange = (serviceName) => {
    setStepFormData((prev) => {
      const selectedServices = Array.isArray(prev.service) ? prev.service : [];
      const isSelected = selectedServices.includes(serviceName);

      return {
        ...prev,
        service: isSelected
          ? selectedServices.filter((item) => item !== serviceName)
          : [...selectedServices, serviceName],
      };
    });

    if (stepError) setStepError("");
  };

  const handleStepSubmit = async (event) => {
    event.preventDefault();
    const activeStep = quoteSteps[currentStepIndex];
    const currentValue = stepFormData[activeStep.key] ?? "";
    const validationMessage = validateStepValue(activeStep.key, currentValue);

    if (validationMessage) {
      setStepError(validationMessage);
      return;
    }

    const isLastStep = currentStepIndex === quoteSteps.length - 1;
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    try {
      setIsSubmittingLead(true);
      setStepError("");

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stepFormData.name,
          email: stepFormData.email,
          phone: stepFormData.phone,
          services: stepFormData.service,
          requirement: stepFormData.requirement,
          budget: stepFormData.budget,
          source: "quick-enquiry",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit enquiry.");
      }

      setIsComplete(true);
      setTimeout(() => {
        closeQuoteModal();
        router.push("/");
      }, 2200);
    } catch (error) {
      setStepError(error.message || "Failed to submit enquiry.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  useEffect(() => {
    if (!isQuoteModalOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeQuoteModal();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isQuoteModalOpen, closeQuoteModal]);

  if (pathName.startsWith("/dashboard") || pathName === "/schedule" || pathName === "/login") {
    return null;
  }


  return (
    <footer className="bg-black text-white py-8 px-6 sm:px-6">
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-cyan-400 via-cyan-400/90 to-cyan-400/70 text-black rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col gap-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 text-center sm:text-left">
          {/* Logo & About */}
          <div className="flex flex-col items-center sm:items-start">
            <Image
              src={logo}
              alt="logo"
              width={120}
              height={120}
              className="cursor-pointer w-24 sm:w-32 md:w-36"
            />
            <p className="mt-3 text-slate-900 leading-relaxed text-sm sm:text-base max-w-[220px] sm:max-w-[250px]">
              Discover endless possibilities in the{" "}
              <span className="font-semibold text-black">Cyber-space</span>
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-black">
              Useful Links
            </h3>
            <ul className="space-y-2 text-slate-900 text-sm sm:text-base">
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Services" },
                { href: "/about-us", label: "About Us" },
                { href: "/contact-us", label: "Contact Us" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms-and-conditions", label: "Terms & Conditions" },
                { href: "/faq", label: "FAQ" },
                // { href: "/login", label: "Login" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="relative hover:text-slate-700 transition duration-200 after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-slate-700 after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* {!isAuthenticated && (
                              <li>
                                <button
                                  type="button"
                                  onClick={openQuoteModal}
                                  className="flex items-center justify-center gap-1 px-4 py-1 text-cyan-100 border border-cyan-500/40 rounded-full transition-all duration-300 hover:bg-cyan-500/10"
                                >
                                  Quick Enquiry
                                </button>
                              </li>
                            )} */}
              
                            {isAuthenticated ? (
                              <>
                                <li>
                                  <Link
                                    href="/dashboard"
                                    className=" relative hover:text-slate-700 transition duration-200 after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-slate-700 after:transition-all after:duration-300 hover:after:w-full"
                                  >
                                    Dashboard
                                  </Link>
                                </li>
                                {/* <li>
                                  <button
                                    type="button"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="flex items-center justify-center gap-1 px-4 py-1 text-cyan-100 border border-cyan-500/40 rounded-full transition-all duration-300 hover:bg-cyan-500/10"
                                  >
                                    Logout
                                  </button>
                                </li> */}
                              </>
                            ) : (
                              <li>
                                <Link
                                  href="/login"
                                  className=" relative hover:text-slate-700 transition duration-200 after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-slate-700 after:transition-all after:duration-300 hover:after:w-full"
                                >
                                  Dashboard
                                </Link>
                              </li>
                            )}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-black">
              Services
            </h3>
            <ul className="space-y-2 text-slate-900 text-sm sm:text-base">
              {[
                { href: "/services/ai-intelligent-systems", label: "AI & Intelligent Systems" }, // ✅ Added first
                { href: "/services/web-development", label: "Web Development" },
                { href: "/services/app-development", label: "App Development" },
                { href: "/services/software-development", label: "Software Development" },
                { href: "/services/ui-ux-design", label: "UI/UX Design" },
                { href: "/services/digital-marketing", label: "Digital Marketing" },
                { href: "/services/graphic-design", label: "Graphic Design" },
                { href: "/services/research-and-analytics", label: "Research and Analytics" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative inline-block hover:text-slate-700 transition duration-200 after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-slate-700 after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-black">
              Get In Touch
            </h3>
            <p className="text-slate-900 text-sm sm:text-base">
              <a href="tel:+917980715765" className="hover:text-slate-700 transition">
                +91 7980715765
              </a>
            </p>
            <p className="text-slate-900 text-sm sm:text-base">
              <a href="mailto:cyberspaceworksofficial@gmail.com" className="hover:text-slate-700 transition">
                cyberspaceworksofficial@gmail.com
              </a>
            </p>

            {/* Social Media Links */}
            <div className="flex justify-center sm:justify-start space-x-4 mt-4 text-black text-lg sm:text-xl">
              <a href="https://www.facebook.com/profile.php?id=100086774724799" target="_blank" rel="noopener noreferrer">
                <FaFacebookF className="cursor-pointer hover:scale-110 transition" />
              </a>
              <a href="https://www.instagram.com/cyberspaceworks" target="_blank" rel="noopener noreferrer">
                <FaInstagram className="cursor-pointer hover:scale-110 transition" />
              </a>
              <a href="https://wa.me/917980715765" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="cursor-pointer hover:scale-110 transition" />
              </a>
              <a href="https://www.google.com/maps/place/Cyberspace+Works+-+Website,+Software+and+App+Developer+in+Howrah,+Kolkata/@22.6434765,88.3408238,716m/data=!3m2!1e3!4b1!4m6!3m5!1s0x39f89dd56c959339:0x59f91e11a807e487!8m2!3d22.6434765!4d88.3433987!16s%2Fg%2F11tfxl7lfx?authuser=0&entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer">
                <FaMapMarkerAlt className="cursor-pointer hover:scale-110 transition" />
              </a>
              <a href="https://www.linkedin.com/company/cyberspace-works" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="cursor-pointer hover:scale-110 transition" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center text-slate-900 text-xs sm:text-sm border-t border-gray-300/30 pt-4">
          © {currentYear} All Rights Reserved.
        </div>
      </div>

      {/* Quote Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm"
            onClick={() => closeQuoteModal()}
          ></div>

          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-cyan-400/30 bg-[#050b14] p-6 shadow-[0_0_40px_rgba(6,182,212,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                closeQuoteModal();
              }}
              className="absolute right-3 top-3 text-cyan-200 hover:text-cyan-400"
              aria-label="Close form"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {isComplete ? (
              <div className="py-8 text-center">
                <h3 className="text-2xl font-semibold text-cyan-300">Thank you</h3>
                <p className="mt-3 text-sm text-cyan-100/90">
                  Thanks for choosing us. We will contact you at the earliest.
                </p>
              </div>
            ) : (
              <form onSubmit={handleStepSubmit} className="space-y-4">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-400/80">
                  Step {currentStepIndex + 1} of {quoteSteps.length}
                </p>
                <h3 className="text-xl font-semibold text-white">
                  {quoteSteps[currentStepIndex].label}
                </h3>

                {quoteSteps[currentStepIndex].type === "checkbox" ? (
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-cyan-500/30 bg-black/40 p-3">
                    {services.map((serviceItem) => {
                      const isChecked = Array.isArray(stepFormData.service) && stepFormData.service.includes(serviceItem.name);
                      return (
                        <label
                          key={serviceItem.name}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleServiceSelectionChange(serviceItem.name)}
                            className="h-4 w-4 accent-cyan-400"
                          />
                          <span className="text-sm text-cyan-100">{serviceItem.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type={quoteSteps[currentStepIndex].type}
                    value={stepFormData[quoteSteps[currentStepIndex].key]}
                    onChange={handleStepInputChange}
                    placeholder={quoteSteps[currentStepIndex].placeholder}
                    className="w-full rounded-lg border border-cyan-500/30 bg-black/40 px-4 py-3 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none"
                    autoFocus
                  />
                )}

                {stepError && (
                  <p className="text-sm text-red-300">{stepError}</p>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={currentStepIndex === 0}
                    onClick={() => {
                      setStepError("");
                      setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
                    }}
                    className="rounded-full border border-cyan-500/40 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                  >
                    {isSubmittingLead
                      ? "Submitting..."
                      : currentStepIndex === quoteSteps.length - 1
                        ? "Final Submit"
                        : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;