import BaseLayout from "./layouts/BaseLayout";
import AboutPractice from "./components/AboutPractice";
import ConsultationOverview from "./components/ConsultationOverview";
import FAQ from "./components/FAQ";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Preparation from "./components/Preparation";
import BookPage from "./pages/BookPage";
import "./styles/landing.css";

type AppProps = {
  pathname?: string;
};

type PageMetadata = {
  title: string;
  description: string;
};

const homePage: PageMetadata = {
  title: "Celestial Guidance",
  description: "Private one-to-one astrology consultations with a clear route to booking.",
};

const bookingPage: PageMetadata = {
  title: "Book | Celestial Guidance",
  description: "Choose a time for a private one-to-one astrology consultation.",
};

function currentPathname(pathname?: string) {
  return pathname ?? (typeof window === "undefined" ? "/" : window.location.pathname);
}

export function getPageMetadata(pathname: string): PageMetadata {
  return pathname === "/book/" || pathname === "/book" ? bookingPage : homePage;
}

export default function App({ pathname }: AppProps) {
  const activePathname = currentPathname(pathname);
  const isBookingPage = activePathname === "/book/" || activePathname === "/book";
  const page = getPageMetadata(activePathname);

  return (
    <BaseLayout description={page.description} title={page.title}>
      {isBookingPage ? (
        <BookPage />
      ) : (
        <>
          <Hero />
          <ConsultationOverview />
          <HowItWorks />
          <AboutPractice />
          <Preparation />
          <FAQ />
        </>
      )}
    </BaseLayout>
  );
}
