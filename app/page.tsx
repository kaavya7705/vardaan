"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import Lenis from "@studio-freight/lenis";
import { ArrowRight, Building2, HardHat, Compass, Ruler, Menu, X, ChevronRight, CheckCircle2, PhoneCall, Mail, MessageCircle } from "lucide-react";
import VardaanLogo from "@/components/VardaanLogo";

type ProjectItem = {
  _id?: string;
  img: string;
  title: string;
  tag: string;
  location: string;
  client: string;
  duration: string;
  description: string;
};

const fallbackProjects: ProjectItem[] = [
  { 
    img: "/project1.png", 
    title: "The Zenith Villa", 
    tag: "Residential Estate", 
    location: "Hills District",
    client: "Confidential",
    duration: "14 Months",
    description: "A masterclass in modern luxury set against the rolling hills. The Zenith Villa combines raw concrete textures with expansive glass volumes to blur the line between interior and environment. Features automated climate systems, a negative-edge pool, and a subterranean four-car gallery."
  },
  { 
    img: "/project2.png", 
    title: "Apex Corporate Hub", 
    tag: "Commercial Base", 
    location: "Downtown Center",
    client: "Apex Financial Group",
    duration: "22 Months",
    description: "A towering testament to commercial ambition. This 42-story hub features a kinetic facade that responds to solar alignment, reducing cooling costs by 30%. The interior boasts a soaring 6-story atrium, column-free floor plates, and biophilic design elements throughout the common spaces."
  },
  { 
    img: "/project3.png", 
    title: "Skyline Overpass", 
    tag: "Infrastructure", 
    location: "Metro Line",
    client: "Department of Transportation",
    duration: "36 Months",
    description: "A critical artery for the city's expanding transit network. The Skyline Overpass utilizes pre-tensioned box girders to achieve daring spans over active rail lines. The project was delivered 2 months ahead of schedule with zero major safety incidents, setting a new benchmark for urban infrastructure."
  }
];

export default function Home() {
  const mobileProjectsPerPage = 3;
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<ProjectItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [mobilePortfolioPage, setMobilePortfolioPage] = useState(0);

  // Lock scroll when modal is open
  useEffect(() => {
    if (activeProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [activeProject]);

  // Mobile detection and animation gating
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Smooth scrolling setup with Lenis (desktop only)
  useEffect(() => {
    if (isMobile) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobile]);

  // Parallax & Mouse Tracking for Hero
  const heroRef = useRef<HTMLElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const yHeroText = useTransform(heroScroll, [0, 1], ["0%", "40%"]);
  const opacityHero = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const scaleHeroImg = useTransform(heroScroll, [0, 1], [1, 1.15]);

  // Optimized Mouse Tracking (prevents React re-renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 60, damping: 30, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  
  // Transform values based on mouse position
  const bgTranslateX = useTransform(springX, [-1, 1], [30, -30]);
  const bgTranslateY = useTransform(springY, [-1, 1], [30, -30]);
  
  const orb1X = useTransform(springX, [-1, 1], [-60, 60]);
  const orb1Y = useTransform(springY, [-1, 1], [-60, 60]);
  
  const orb2X = useTransform(springX, [-1, 1], [80, -80]);
  const orb2Y = useTransform(springY, [-1, 1], [80, -80]);
  
  useEffect(() => {
    if (isMobile) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, mouseX, mouseY]);

  const fetchProjects = async (cursor?: string) => {
    if (isLoadingProjects) {
      return;
    }

    setIsLoadingProjects(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("limit", "5");
      if (cursor) {
        searchParams.set("cursor", cursor);
      }

      const response = await fetch(`/api/marvels?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Unable to fetch projects");
      }

      const data = (await response.json()) as {
        items: ProjectItem[];
        nextCursor: string | null;
      };

      if (!cursor && data.items.length === 0) {
        setPortfolioProjects(fallbackProjects);
        setNextCursor(null);
        return;
      }

      setPortfolioProjects((prev) =>
        cursor ? [...prev, ...data.items] : data.items
      );
      setNextCursor(data.nextCursor);
    } catch {
      if (!cursor) {
        setPortfolioProjects(fallbackProjects);
        setNextCursor(null);
      }
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const maxPage = Math.max(
      0,
      Math.ceil(portfolioProjects.length / mobileProjectsPerPage) - 1
    );
    setMobilePortfolioPage((prev) => Math.min(prev, maxPage));
  }, [portfolioProjects.length]);

  useEffect(() => {
    if (!nextCursor || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          fetchProjects(nextCursor);
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [nextCursor, isLoadingProjects]);

  const mobilePageCount = Math.max(
    1,
    Math.ceil(portfolioProjects.length / mobileProjectsPerPage)
  );
  const mobileProjectsToShow = portfolioProjects.slice(
    mobilePortfolioPage * mobileProjectsPerPage,
    mobilePortfolioPage * mobileProjectsPerPage + mobileProjectsPerPage
  );

  const goToNextMobileProjects = async () => {
    const hasLocalNextPage =
      (mobilePortfolioPage + 1) * mobileProjectsPerPage < portfolioProjects.length;

    if (hasLocalNextPage) {
      setMobilePortfolioPage((prev) => prev + 1);
      return;
    }

    if (nextCursor && !isLoadingProjects) {
      await fetchProjects(nextCursor);
      return;
    }
  };

  // Form State
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      contactUs: String(formData.get("contactUs") ?? "").trim(),
      projectType: String(formData.get("projectType") ?? "").trim(),
      details: String(formData.get("details") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

      setFormState("success");
      setTimeout(() => setFormState("idle"), 4000);
      form.reset();
    } catch {
      setFormState("error");
      setTimeout(() => setFormState("idle"), 5000);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number]} 
    },
  };

  const shouldAnimateOnScroll = !isMobile;

  return (
    <main className="relative min-h-screen bg-slate-50 selection:bg-amber-500/30 overflow-x-hidden text-slate-900" role="main">
      {/* ═ Navigation ═ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm" : "py-6 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <button className="cursor-pointer" onClick={() => scrollTo("home")} aria-label="Go to home">
            <VardaanLogo light={!isScrolled} textClassName={isScrolled ? "text-slate-900" : "text-white"} />
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            {["Home", "About", "Services", "Portfolio", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className={`text-sm font-medium transition-colors relative group py-2 ${isScrolled ? "text-slate-600 hover:text-blue-900" : "text-white/90 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
            <button 
              onClick={() => scrollTo("contact")}
              className="ml-4 px-8 py-3 rounded-full bg-blue-950 text-white text-sm font-semibold hover:bg-amber-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transform hover:-translate-y-0.5"
            >
              Start Project
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className={`lg:hidden p-2 relative z-50 ${isScrolled ? "text-slate-900" : "text-white"}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center"
          >
            <div className="mb-12">
              <VardaanLogo />
            </div>
            <div className="flex flex-col items-center gap-10">
              {["Home", "About", "Services", "Portfolio", "Contact"].map((item, i) => (
                <motion.button
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  onClick={() => scrollTo(item.toLowerCase())}
                  className="font-serif text-5xl text-slate-800 hover:text-amber-500 transition-colors"
                >
                  {item}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═ Hero Section ═ */}
      <section id="home" ref={heroRef} className="relative h-[100svh] pt-24 pb-12 flex flex-col items-center justify-center overflow-hidden perspective-[1000px] bg-slate-100">
        {/* Background Layer with Parallax Matrix */}
        <motion.div 
          style={{ 
            scale: isMobile ? 1 : scaleHeroImg,
            x: isMobile ? 0 : bgTranslateX,
            y: isMobile ? 0 : bgTranslateY,
            willChange: "transform"
          }} 
          className="absolute inset-[-5%] w-[110%] h-[110%]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-cyan-950/45 to-slate-900/80 z-10" />
          <Image
            src="/hero-bg.png"
            alt="Vardaan Builders & Contractors — Premium construction and architectural excellence"
            fill
            className="object-cover opacity-70 mix-blend-overlay mix-blend-primary"
            priority
          />
        </motion.div>

        {/* Ambient Floating Orbs */}
        <motion.div 
          style={{ 
            x: isMobile ? 0 : orb1X, 
            y: isMobile ? 0 : orb1Y,
            willChange: "transform"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-300/22 blur-[120px] rounded-full pointer-events-none z-10"
        />
        <motion.div 
          style={{ 
            x: isMobile ? 0 : orb2X, 
            y: isMobile ? 0 : orb2Y,
            willChange: "transform"
          }}
          className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-sky-300/22 blur-[130px] rounded-full pointer-events-none z-10"
        />

        <motion.div 
          style={{ y: yHeroText, opacity: opacityHero, willChange: "transform, opacity" }}
          className="relative z-20 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center justify-center h-full pt-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/30 bg-white/12 mb-6 backdrop-blur-xl shadow-[0_0_30px_rgba(56,189,248,0.22)] relative overflow-hidden group"
          >
            {/* Shimmer effect inside badge */}
            <motion.div 
              className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
              animate={{ x: ['-200%', '300%'] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            />
            <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse shadow-[0_0_15px_rgba(253,186,116,0.85)]" />
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-orange-100 uppercase drop-shadow-sm">Premium Construction</span>
          </motion.div>

          <motion.h1 
            className="font-display text-[clamp(1.75rem,6vw,7rem)] font-extrabold leading-[1.1] md:leading-[1.05] text-white mb-4 drop-shadow-lg"
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            <div className="overflow-hidden pb-2">
              <motion.span 
                initial={{ y: "150%", rotate: 5, filter: "blur(10px)", letterSpacing: "0.2em" }}
                animate={{ y: 0, rotate: 0, filter: "blur(0px)", letterSpacing: "0em" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="block text-white pb-2 origin-bottom drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]"
              >
                Dream. Design. Deliver.
              </motion.span>
            </div>
            <div className="overflow-hidden pb-2">
              <motion.span 
                initial={{ y: "150%", rotate: -5, filter: "blur(10px)" }}
                animate={{ y: 0, rotate: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="block text-orange-300 pb-2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]"
              >
                That&apos;s the Vardaan Promise!
              </motion.span>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 1, duration: 1.5 }}
            className="max-w-2xl text-sm sm:text-base md:text-xl text-slate-100 font-light mb-8 text-balance leading-relaxed drop-shadow-md"
          >
            Elevating modern architecture through uncompromising engineering. We craft legacy structures that stand the test of time, executing every detail with absolute precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8, type: "spring", stiffness: 100 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-30 flex-shrink-0"
          >
            <button 
              onClick={() => scrollTo("portfolio")}
              className="w-full sm:w-auto overflow-hidden relative group flex items-center justify-center gap-3 bg-orange-300 text-slate-900 px-8 py-4 rounded-full font-bold text-base transition-transform shadow-[0_4px_20px_rgba(251,146,60,0.38)] hover:shadow-[0_8px_30px_rgba(251,146,60,0.5)] transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-white/30 translate-y-[100%] rounded-full group-hover:translate-y-[0%] transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-3">
                View Our Work
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>
            <button 
              onClick={() => scrollTo("about")}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold text-slate-900 bg-white/95 shadow-lg hover:bg-white transition-colors transform hover:scale-105 duration-300 text-base"
            >
              Our Legacy
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={isMobile ? false : { opacity: 0 }}
          animate={isMobile ? false : { opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-2"
        >
          <div className="w-[2px] h-8 sm:h-12 bg-white/35 relative overflow-hidden rounded-full">
            <motion.div 
              className="absolute top-0 left-0 w-full h-1/2 bg-orange-300 rounded-full"
              animate={{ y: [0, 48, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ═ About Section ═ */}
      <section id="about" className="py-16 sm:py-24 md:py-32 relative bg-white overflow-hidden">
        {/* Colorful Abstract background shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-100 rounded-full blur-[100px] opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-100 rounded-full blur-[100px] opacity-50 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={shouldAnimateOnScroll ? "hidden" : "show"}
              animate={shouldAnimateOnScroll ? undefined : "show"}
              whileInView={shouldAnimateOnScroll ? "show" : undefined}
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="max-w-2xl order-2 lg:order-1"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
                <div className="w-16 h-[2px] bg-amber-500"></div>
                <span className="text-sm font-bold tracking-[0.2em] text-blue-900 uppercase">Since 2021</span>
              </motion.div>
              
              <motion.h2 variants={fadeUp} className="font-serif text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.15] mb-8">
                Building legacy, <span className="italic text-slate-500 font-light text-gradient">one project at a time.</span>
              </motion.h2>
              
              <motion.div variants={fadeUp} className="space-y-6 text-lg text-slate-600 font-light leading-relaxed">
                <p>
                  Founded by visionary <span className="text-blue-950 font-medium">Abhi Mehta</span>, Vardaan Builders & Contractors rapidly established itself as a premier name in high-end construction. 
                </p>
                <p>
                  We merge cutting-edge technology with time-honored craftsmanship. Our uncompromising commitment to quality has earned us an industry-leading <strong className="text-amber-600 font-semibold">99% project completion rate</strong> — a testament to our dedication to every client&apos;s vision.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-12 grid grid-cols-2 gap-8 pt-10 border-t border-slate-200">
                <div>
                  <div className="text-5xl md:text-6xl font-serif text-blue-950 mb-3">99<span className="text-amber-500">%</span></div>
                  <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-semibold">Completion Rate</div>
                </div>
                <div>
                  <div className="text-5xl md:text-6xl font-serif text-blue-950 mb-3">150<span className="text-amber-500">+</span></div>
                  <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-semibold">Projects Delivered</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={isMobile ? false : { opacity: 0, scale: 0.95 }}
              whileInView={isMobile ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative aspect-square sm:aspect-[4/5] lg:aspect-square xl:aspect-[4/5] rounded-3xl overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.1)] order-1 lg:order-2 border border-slate-100"
            >
              <Image 
                src="/project2.png" 
                alt="Vardaan Builders project — Luxury residential construction with premium finishing" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/20 to-transparent mix-blend-multiply opacity-60"></div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 p-6 md:p-8 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl transform translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 border border-slate-100">
                <p className="text-amber-600 font-bold tracking-widest text-xs uppercase mb-2">Uncompromising Standards</p>
                <p className="text-slate-800 text-sm sm:text-base font-light leading-relaxed">Every material sourced, every beam placed undergoes rigorous quality control.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═ Bento Grid Services ═ */}
      <section id="services" className="py-16 sm:py-24 md:py-32 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-[2px] bg-amber-500"></div>
                <span className="text-sm font-bold tracking-[0.2em] text-blue-950 uppercase">Our Expertise</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.15]">
                Mastery in{' '}
                <br className="hidden sm:block"/>
                <span className="italic text-slate-400 font-light">every dimension.</span>
              </h2>
            </div>
            <button 
              onClick={() => scrollTo("contact")}
              className="flex items-center gap-3 text-blue-950 hover:text-amber-600 transition-colors group pb-2 border-b-2 border-slate-300 hover:border-amber-500 font-medium whitespace-nowrap"
            >
              Discuss your project
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>

          {/* Secure Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            
            {/* Card 1: Large */}
            <motion.div 
              initial={isMobile ? false : { opacity: 0, y: 30 }}
              whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 lg:row-span-2 relative group overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-6 sm:p-8 md:p-12 flex flex-col justify-between hover:border-blue-200 transition-all shadow-xl hover:shadow-2xl min-h-[280px] sm:min-h-[400px]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 text-blue-900">
                <Building2 size={160} strokeWidth={1} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-8 text-amber-500 font-serif text-2xl shadow-sm group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors">01</div>
                <h3 className="font-serif text-3xl sm:text-4xl text-blue-950 mb-6 group-hover:text-blue-800 transition-colors">General Contracting</h3>
                <p className="text-slate-600 max-w-xl text-lg font-light leading-relaxed mb-8">
                  End-to-end master project management for high-end residential estates and commercial hubs. From foundation casting to final finishing, we act as the central nervous system of your build ensuring zero-compromise precision.
                </p>
              </div>
              <div className="relative z-10 flex gap-3 sm:gap-4 flex-wrap mt-auto">
                {["Project Management", "Site Logistics", "Quality Assurance"].map(tag => (
                  <span key={tag} className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-blue-200 transition-colors shadow-sm">{tag}</span>
                ))}
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={isMobile ? false : { opacity: 0, y: 30 }}
              whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative group overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-6 sm:p-8 md:p-10 flex flex-col hover:border-amber-200 transition-all shadow-md hover:shadow-xl hover:-translate-y-1 min-h-[220px] sm:min-h-[300px]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors shadow-sm">
                  <Ruler size={28} />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-blue-950 mb-4">Design & Build</h3>
                <p className="text-slate-600 font-light leading-relaxed">Seamless integration of award-winning architectural design and flawless construction execution. One unified team.</p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={isMobile ? false : { opacity: 0, y: 30 }}
              whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative group overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-6 sm:p-8 md:p-10 flex flex-col hover:border-sky-200 transition-all shadow-md hover:shadow-xl hover:-translate-y-1 min-h-[220px] sm:min-h-[300px]"
            >
              <div className="absolute inset-0 bg-gradient-to-tl from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-colors shadow-sm">
                  <Compass size={28} />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-blue-950 mb-4">Renovation</h3>
                <p className="text-slate-600 font-light leading-relaxed">Breathing architectural life into existing structures. We preserve historic character while injecting ultra-modern functionality.</p>
              </div>
            </motion.div>

            {/* Card 4 (Full Width Bottom) */}
            <motion.div 
              initial={isMobile ? false : { opacity: 0, y: 30 }}
              whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 lg:col-span-3 relative group overflow-hidden rounded-[2rem] border border-slate-200 flex flex-col lg:flex-row hover:border-blue-300 transition-all bg-white shadow-xl hover:shadow-2xl min-h-[280px] sm:min-h-[350px] cursor-pointer"
            >
              <div className="flex-1 p-6 sm:p-8 md:p-12 flex flex-col justify-center order-2 lg:order-1 relative z-10 bg-white/80 backdrop-blur-md lg:backdrop-blur-none lg:bg-transparent transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-8 text-amber-500 shadow-sm group-hover:shadow-md group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <HardHat size={32} />
                </div>
                <h3 className="font-serif text-3xl sm:text-4xl text-blue-950 mb-6 transition-colors duration-500">Infrastructure Division</h3>
                <p className="text-slate-600 font-light text-lg mb-8 leading-relaxed max-w-xl transition-colors duration-500">Heavy civil engineering and public utility construction. Built to endure generations with rigorous safety standards.</p>
                <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
                  <span className="flex items-center gap-2 text-sm text-slate-700 font-medium whitespace-nowrap bg-slate-100 px-4 py-2 rounded-full border border-slate-200 group-hover:border-blue-200 group-hover:bg-white transition-colors"><CheckCircle2 size={18} className="text-amber-500"/> Bridges & Roads</span>
                  <span className="flex items-center gap-2 text-sm text-slate-700 font-medium whitespace-nowrap bg-slate-100 px-4 py-2 rounded-full border border-slate-200 group-hover:border-blue-200 group-hover:bg-white transition-colors"><CheckCircle2 size={18} className="text-amber-500"/> Public Utilities</span>
                  
                  {/* Slide-in arrow on hover */}
                  <span className="ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 shadow-lg group-hover:shadow-[0_4px_15px_rgba(37,99,235,0.4)]">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </div>
              <div className="flex-1 relative min-h-[250px] lg:min-h-full order-1 lg:order-2 overflow-hidden">
                <Image src="/project3.png" alt="Vardaan Builders infrastructure division — Bridges, roads & public utility construction" fill className="object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 lg:bg-gradient-to-r lg:from-white lg:via-white/90 lg:to-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-700" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═ Horizontal Scrolling / Portfolio ═ */}
      <section id="portfolio" className="py-16 sm:py-24 md:py-32 overflow-hidden bg-blue-950 relative">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-900 to-transparent opacity-50 pointer-events-none"></div>
        <div className="pointer-events-none absolute left-[6%] top-7 h-12 w-28 rounded-full bg-white/90 shadow-[0_10px_18px_rgba(15,23,42,0.18)]">
          <span className="absolute -left-3 top-2 h-9 w-12 rounded-full bg-white/90" />
          <span className="absolute left-8 -top-3 h-10 w-14 rounded-full bg-white" />
          <span className="absolute right-3 top-1 h-8 w-10 rounded-full bg-white/95" />
        </div>
        <div className="pointer-events-none absolute right-[8%] top-12 h-14 w-36 rounded-full bg-slate-100/90 shadow-[0_10px_18px_rgba(15,23,42,0.18)]">
          <span className="absolute -left-4 top-3 h-10 w-14 rounded-full bg-slate-100/95" />
          <span className="absolute left-9 -top-4 h-12 w-16 rounded-full bg-white" />
          <span className="absolute right-4 top-2 h-9 w-12 rounded-full bg-slate-50" />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-5 hidden h-10 w-24 -translate-x-1/2 rounded-full bg-white/85 shadow-[0_8px_14px_rgba(15,23,42,0.16)] sm:block">
          <span className="absolute -left-3 top-2 h-7 w-10 rounded-full bg-white/90" />
          <span className="absolute left-6 -top-2 h-8 w-12 rounded-full bg-white" />
        </div>
        <div className="container mx-auto px-6 lg:px-12 mb-16 md:mb-24 flex flex-col items-center relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-bold tracking-[0.2em] text-amber-400 uppercase">Selected Works</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white text-center leading-[1.1]">
            Architectural <span className="italic text-blue-200 font-light">marvels.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 px-6 pb-10 lg:px-12 gap-8 md:hidden relative z-10">
          {mobileProjectsToShow.map((project, i) => (
            <motion.div
              key={`${project._id ?? project.title}-${i}`}
              initial={false}
              onClick={() => setActiveProject(project)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 shadow-2xl border border-white/10">
                <Image src={project.img} alt={project.title} fill className="object-cover opacity-90" />
                <div className="absolute inset-0 bg-blue-950/25"></div>
              </div>
              <div className="flex justify-between items-start px-1">
                <div>
                  <span className="text-xs font-bold tracking-widest text-amber-300 uppercase mb-2 block">{project.tag}</span>
                  <h3 className="font-serif text-2xl text-white">{project.title}</h3>
                </div>
                <div className="w-11 h-11 rounded-full border border-white/20 flex shrink-0 items-center justify-center text-white bg-blue-900/40">
                  <ArrowRight size={18} className="-rotate-45" />
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobilePortfolioPage((prev) => Math.max(0, prev - 1))}
              disabled={mobilePortfolioPage === 0}
              className="rounded-full border border-white/25 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs tracking-[0.2em] text-blue-200 uppercase">
              {mobilePortfolioPage + 1} / {mobilePageCount}
            </span>
            <button
              type="button"
              onClick={goToNextMobileProjects}
              disabled={
                !nextCursor &&
                (mobilePortfolioPage + 1) * mobileProjectsPerPage >= portfolioProjects.length
              }
              className="rounded-full border border-white/25 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {/* Desktop Horizontal Scroll Container */}
        <div className="hidden md:flex overflow-x-auto pb-16 px-6 lg:px-12 gap-6 sm:gap-10 snap-x snap-mandatory hide-scrollbar relative z-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {portfolioProjects.map((project, i) => (
            <motion.div 
              key={`${project._id ?? project.title}-${i}`}
              initial={isMobile ? false : { opacity: 0, x: 50 }}
              whileInView={isMobile ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
              onClick={() => setActiveProject(project)}
              className="min-w-[85vw] sm:min-w-[65vw] lg:min-w-[45vw] snap-center group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-8 shadow-2xl border border-white/10">
                <Image src={project.img} alt={project.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-blue-950/20 group-hover:bg-transparent transition-colors duration-500"></div>
                
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-multiply" />
              </div>
              <div className="flex justify-between items-start px-2">
                <div>
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase mb-3 block">{project.tag}</span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white">{project.title}</h3>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/20 flex flex-shrink-0 items-center justify-center text-white bg-blue-900/30 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-blue-950 transition-all duration-300 transform group-hover:-translate-y-1 shadow-lg">
                  <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {isLoadingProjects && (
          <div className="relative z-10 flex justify-center pb-6">
            <div className="h-7 w-7 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}

        {nextCursor && <div ref={loadMoreRef} className="h-8" />}
      </section>

      {/* ═ Form / CTA Section ═ */}
      <section id="contact" className="py-12 sm:py-24 md:py-32 relative bg-white border-t border-slate-200 overflow-hidden" aria-label="Contact Vardaan Builders">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-100/50 to-transparent blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-center">
            <motion.div
              initial={shouldAnimateOnScroll ? "hidden" : "show"}
              animate={shouldAnimateOnScroll ? undefined : "show"}
              whileInView={shouldAnimateOnScroll ? "show" : undefined}
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
                <div className="w-16 h-[2px] bg-amber-500"></div>
                <span className="text-sm font-bold tracking-[0.2em] text-amber-600 uppercase">Consultation</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-serif text-2xl sm:text-5xl lg:text-7xl text-blue-950 mb-6 sm:mb-8 leading-[1.15]">
                Let&apos;s build{' '}
                <br className="hidden sm:block"/>
                <span className="italic text-slate-400 font-light">something iconic.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-600 text-sm sm:text-base md:text-xl font-light mb-8 sm:mb-10 max-w-lg leading-relaxed">
                Whether a luxury residence or a towering commercial hub, our team of principal engineers and architects are ready to realize your vision.
              </motion.p>

              <motion.div variants={fadeUp} className="space-y-8">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-amber-500 shadow-sm group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white transition-all transform group-hover:scale-105 cursor-pointer">
                    <ChevronRight size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-1">General Inquiries</h4>
                    <p className="text-slate-900 text-sm sm:text-base md:text-lg font-medium group-hover:text-blue-900 transition-colors break-all sm:break-normal">vardaanbuildersandcontractors@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-amber-500 shadow-sm group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all transform group-hover:scale-105 cursor-pointer">
                    <ChevronRight size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-1">Direct Line</h4>
                    <p className="text-slate-900 text-sm sm:text-base md:text-lg font-medium group-hover:text-blue-900 transition-colors">7087099999</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={shouldAnimateOnScroll ? { opacity: 0, scale: 0.95, y: 30 } : { opacity: 1, scale: 1, y: 0 }}
              animate={shouldAnimateOnScroll ? undefined : { opacity: 1, scale: 1, y: 0 }}
              whileInView={shouldAnimateOnScroll ? { opacity: 1, scale: 1, y: 0 } : undefined}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-white p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-[2rem] border border-slate-200 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 blur-3xl pointer-events-none"></div>
                <form onSubmit={handleFormSubmit} className="relative z-10 flex flex-col gap-5 sm:gap-8">
                  <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
                    <div className="group">
                      <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 sm:mb-3 transition-colors group-focus-within:text-blue-600">Name</label>
                      <input required name="name" type="text" className="w-full bg-transparent border-b-2 border-slate-200 pb-2 sm:pb-3 text-slate-900 text-base sm:text-lg placeholder:text-slate-300 focus:outline-none focus:border-blue-600 transition-colors rounded-none" placeholder="John Doe" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 sm:mb-3 transition-colors group-focus-within:text-blue-600">Email</label>
                      <input required name="email" type="email" className="w-full bg-transparent border-b-2 border-slate-200 pb-2 sm:pb-3 text-slate-900 text-base sm:text-lg placeholder:text-slate-300 focus:outline-none focus:border-blue-600 transition-colors rounded-none" placeholder="john@company.com" />
                    </div>
                    <div className="group sm:col-span-2">
                      <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 sm:mb-3 transition-colors group-focus-within:text-blue-600">Contact Us</label>
                      <input required name="contactUs" type="text" className="w-full bg-transparent border-b-2 border-slate-200 pb-2 sm:pb-3 text-slate-900 text-base sm:text-lg placeholder:text-slate-300 focus:outline-none focus:border-blue-600 transition-colors rounded-none" placeholder="Phone / WhatsApp number" />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 sm:mb-3 transition-colors group-focus-within:text-blue-600">Project Type</label>
                    <select required name="projectType" className="w-full bg-transparent border-b-2 border-slate-200 pb-2 sm:pb-3 text-slate-900 text-base sm:text-lg focus:outline-none focus:border-blue-600 transition-colors appearance-none rounded-none cursor-pointer">
                      <option value="" disabled className="text-slate-400">Select project type</option>
                      <option value="residential">Residential Estate</option>
                      <option value="commercial">Commercial Hub</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="renovation">Renovation</option>
                      <option value="design-build">Design & Build</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 sm:mb-3 transition-colors group-focus-within:text-blue-600">Project Details</label>
                    <textarea required name="details" rows={3} className="w-full bg-transparent border-b-2 border-slate-200 pb-2 sm:pb-3 text-slate-900 text-base sm:text-lg placeholder:text-slate-300 focus:outline-none focus:border-blue-600 transition-colors resize-none rounded-none" placeholder="Tell us about your vision..."></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={formState !== "idle"}
                    className="mt-2 sm:mt-4 w-full py-4 sm:py-5 bg-blue-950 text-white font-bold text-base sm:text-lg rounded-xl hover:bg-blue-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex justify-center items-center gap-3 shadow-[0_10px_30px_rgba(23,37,84,0.3)] hover:shadow-[0_10px_40px_rgba(23,37,84,0.5)] transform hover:-translate-y-1"
                  >
                    {formState === "idle" && "Submit Inquiry"}
                    {formState === "submitting" && <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />}
                    {formState === "success" && <><CheckCircle2 size={24}/> Received successfully</>}
                    {formState === "error" && "Failed to send. Try again"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═ Footer ═ */}
      <footer className="bg-slate-950 pt-14 sm:pt-16 pb-8 border-t border-slate-800 relative overflow-hidden text-slate-200">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 gap-8 border-b border-slate-800 pb-10 md:grid-cols-3 md:gap-10">
            <div>
              <VardaanLogo light textClassName="text-white" />
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-400">
                Premium construction studio creating architecture-led residential, commercial, and infrastructure projects with unmatched execution.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Quick Links</h4>
              <div className="mt-5 space-y-3 text-sm text-slate-400">
                {[
                  { label: "About", target: "about" },
                  { label: "Services", target: "services" },
                  { label: "Architectural Marvels", target: "portfolio" },
                  { label: "Get In Touch", target: "contact" },
                ].map((item) => (
                  <button key={item.label} onClick={() => scrollTo(item.target)} className="block transition hover:text-amber-300">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Contact Desk</h4>
              <div className="mt-5 space-y-3 text-sm">
                <a
                  href="tel:7087099999"
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300"
                >
                  <PhoneCall size={16} />
                  7087099999
                </a>
                <a
                  href="mailto:vardaanbuildersandcontractors@gmail.com"
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300 break-all"
                >
                  <Mail size={16} />
                  vardaanbuildersandcontractors@gmail.com
                </a>
                <a
                  href="https://wa.me/917087099999"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300"
                >
                  <MessageCircle size={16} />
                  WhatsApp Chat
                </a>
              </div>
            </div>

          </div>

          <div className="pt-6 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Vardaan Builders & Contractors. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <button
        onClick={() => scrollTo("contact")}
        aria-label="Call now and get in touch"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] inline-flex items-center gap-2 sm:gap-3 rounded-full border border-cyan-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(2,132,199,0.28)] transition hover:-translate-y-1 hover:bg-cyan-50"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md">
          <PhoneCall size={18} />
        </span>
        <span className="hidden sm:inline">Call & Get In Touch</span>
      </button>
      
      {/* ═ Project Detail Modal ═ */}
      <AnimatePresence>
        {activeProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12"
          >
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setActiveProject(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row z-10 border border-slate-200 mt-auto mb-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setActiveProject(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 hover:bg-white hover:text-amber-600 transition-colors shadow-sm"
              >
                <X size={24} />
              </button>
              
              {/* Image Section */}
              <div className="lg:w-1/2 relative min-h-[250px] sm:min-h-[350px] lg:min-h-full aspect-[4/3] lg:aspect-auto flex-shrink-0">
                <Image 
                  src={activeProject.img} 
                  alt={activeProject.title} 
                  fill 
                  className="object-cover"
                />
              </div>
              
              {/* Scrollable Content Section with Lenis Prevent */}
              <div className="lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col overflow-y-auto bg-slate-50" data-lenis-prevent="true">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-[2px] bg-amber-500"></div>
                  <span className="text-sm font-bold tracking-widest text-amber-600 uppercase">{activeProject.tag}</span>
                </div>
                
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-blue-950 mb-8 leading-tight">
                  {activeProject.title}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 pb-8 border-b border-slate-200">
                  <div>
                    <span className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Location</span>
                    <span className="text-slate-800 font-medium">{activeProject.location}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Client</span>
                    <span className="text-slate-800 font-medium">{activeProject.client}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Duration</span>
                    <span className="text-slate-800 font-medium">{activeProject.duration}</span>
                  </div>
                </div>
                
                <p className="text-slate-600 font-light leading-relaxed text-base sm:text-lg mb-10">
                  {activeProject.description}
                </p>
                
                <button 
                  onClick={() => {
                    setActiveProject(null);
                    setTimeout(() => scrollTo("contact"), 300);
                  }}
                  className="inline-flex mt-auto items-center justify-center w-full sm:w-auto gap-3 px-8 py-4 rounded-full bg-blue-950 text-white font-semibold hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md transform hover:-translate-y-1 flex-shrink-0"
                >
                  Discuss Similar Project
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Global CSS fragment for specific non-standard hiding */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </main>
  );
}
