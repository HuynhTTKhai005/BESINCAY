"use client";

import dynamic from "next/dynamic";
import AOSInitializer from "./component/AOSInitializer";

const Hero = dynamic(() => import("./hero/page"), { ssr: false });
const About = dynamic(() => import("./about/page"), { ssr: false });
const WhyUs = dynamic(() => import("./whyUs/page"), { ssr: false });
const Stats = dynamic(() => import("./stats/page"), { ssr: false });
const Menu = dynamic(() => import("./menu/page"), { ssr: false });
const Testimonials = dynamic(() => import("./testimonials/page"), { ssr: false });
const Events = dynamic(() => import("./events/page"), { ssr: false });
const Book = dynamic(() => import("./book/page"), { ssr: false });
const Gallery = dynamic(() => import("./gallery/page"), { ssr: false });
const Contact = dynamic(() => import("./contact/page"), { ssr: false });
 



export default function Home() {
  return (
    <>
      <AOSInitializer />
      <Hero />
      <About />
      <WhyUs />
      <Stats />
      <Menu />
      <Testimonials />
      <Events />
      <Book />
      <Gallery />
      <Contact />
       
    </>
  );
}
