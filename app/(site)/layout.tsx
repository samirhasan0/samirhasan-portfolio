import SmoothScroll from '@/components/SmoothScroll';
import Navigation from '@/components/Navigation';
import ClientShell from '@/components/ClientShell';
import Backdrop from '@/components/journey/Backdrop';

/** The main site: smooth scroll, the 3D scroll scene, intro + sound, and navigation. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Backdrop />
      <ClientShell />
      <Navigation />
      <div className="relative z-10">{children}</div>
    </SmoothScroll>
  );
}
