import BaseLayout from "./layouts/BaseLayout";
import ConsultationOverview from "./components/ConsultationOverview";
import FAQ from "./components/FAQ";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import MeetNilima from "./components/MeetNilima";
import Preparation from "./components/Preparation";
import ServiceCards from "./components/ServiceCards";
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
  description:
    "Private astrology consultations with Nilima Sawane for personal insight, relationships, and meaningful timing.",
};

const bookingPage: PageMetadata = {
  title: "Book | Celestial Guidance",
  description: "Choose a reading and book a private Google Meet consultation with Nilima Sawane.",
};

function currentPathname(pathname?: string) {
  return pathname ?? (typeof window === "undefined" ? "/" : window.location.pathname);
}

export function getRouteKind(pathname: string) {
  return pathname === "/book/" || pathname === "/book" ? "booking" : "home";
}

export function getPageMetadata(pathname: string): PageMetadata {
  return getRouteKind(pathname) === "booking" ? bookingPage : homePage;
}

export default function App({ pathname }: AppProps) {
  const activePathname = currentPathname(pathname);
  const isBookingPage = getRouteKind(activePathname) === "booking";
  const page = getPageMetadata(activePathname);

  return (
    <BaseLayout description={page.description} title={page.title}>
      {isBookingPage ? (
        <BookPage />
      ) : (
        <>
          <Hero />
          <ServiceCards />
          <MeetNilima />
          <HowItWorks />
          <Preparation />
          <ConsultationOverview />
          <FAQ />
        </>
      )}
    </BaseLayout>
  );
}
