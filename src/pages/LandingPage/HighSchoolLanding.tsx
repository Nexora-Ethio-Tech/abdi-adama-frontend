import Hero from "./components/Hero";
import FounderMessage from "./components/FounderMessage";
import SchoolStats from "./components/SchoolStats";
import HorizontalScroll from "./components/HorizontalScroll";
import StudentBook from "./components/StudentBook";
import FinalCTA from "./components/FinalCTA";

export default function HomePage() {
  return (
    <div className="font-sans antialiased">

      <main>
        <Hero />
        <FounderMessage />
        <SchoolStats />
        <HorizontalScroll />
        <StudentBook />
        <FinalCTA />
      </main>
    </div>
  );
}