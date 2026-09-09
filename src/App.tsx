import BaseLayout from "./layouts/BaseLayout";
import FAQ from "./components/FAQ";
import Hero from "./components/Hero";
import MeetNilima from "./components/MeetNilima";
import Preparation from "./components/Preparation";
import ServiceCards from "./components/ServiceCards";
import BookPage from "./pages/BookPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./styles/landing.css";

type AppProps = {
  pathname?: string;
};

type PageMetadata = {
  title: string;
  description: string;
};

const homePage: PageMetadata = {
  title: "Nakshatra | Personal Kundli consultations with Nilima Sawane",
  description:
    "Personal Kundli readings prepared by Nilima Sawane for individual questions, relationships and important dates. Consultations in Hindi and Marathi.",
};

const bookingPage: PageMetadata = {
  title: "Book a Kundli consultation | Nakshatra",
  description:
    "Choose a personal, relationship or best-date reading with Nilima Sawane and view available consultation times.",
};

const notFoundPage: PageMetadata = {
  title: "Page not found | Nakshatra",
  description:
    "The requested Nakshatra page could not be found. Return home or view consultations with Nilima Sawane.",
};

function currentPathname(pathname?: string) {
  return pathname ?? (typeof window === "undefined" ? "/" : window.location.pathname);
}

export function getRouteKind(pathname: string) {
  if (pathname === "/") return "home" as const;
  if (pathname === "/book" || pathname === "/book/") return "booking" as const;
  return "not-found" as const;
}

export function getPageMetadata(pathname: string): PageMetadata {
  const routeKind = getRouteKind(pathname);

  if (routeKind === "booking") return bookingPage;
  if (routeKind === "not-found") return notFoundPage;
  return homePage;
}

export default function App({ pathname }: AppProps) {
  const activePathname = currentPathname(pathname);
  const routeKind = getRouteKind(activePathname);
  const page = getPageMetadata(activePathname);

  return (
    <BaseLayout description={page.description} title={page.title}>
      {routeKind === "booking" ? (
        <BookPage />
      ) : routeKind === "not-found" ? (
        <NotFoundPage />
      ) : (
        <>
          <Hero />
          <MeetNilima />
          <ServiceCards />
          <Preparation />
          <FAQ />
        </>
      )}
    </BaseLayout>
  );
}
