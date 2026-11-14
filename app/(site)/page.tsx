import Hero from '@/components/Hero';
import About from '@/components/About';
import Work from '@/components/Work';
import Principles from '@/components/Principles';
import Journey from '@/components/Journey';
import Vision from '@/components/Vision';
import Contact from '@/components/Contact';

/** Each section is one chapter of the scroll journey (see components/journey/store.ts). */
export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Work />
      <Principles />
      <Journey />
      <Vision />
      <Contact />
    </main>
  );
}
