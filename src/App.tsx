import { useEffect, useState } from "react";
import BaseLayout from "./layouts/BaseLayout";
import Contact from "./components/Contact";
import FAQ from "./components/FAQ";
import Hero from "./components/Hero";
import MeetNilima from "./components/MeetNilima";
import Preparation from "./components/Preparation";
import Reviews from "./components/Reviews";
import ServiceCards from "./components/ServiceCards";
import BookPage from "./pages/BookPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
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
    "A personal astrology consultation built around your birth chart for questions about marriage, career, family and important decisions.",
};

const bookingPage: PageMetadata = {
  title: "Book a Kundli consultation | Nakshatra",
  description:
    "Choose a personal consultation, Kundli Milan or Muhurat reading with Nilima Sawane and view available consultation times.",
};

const bookingConfirmationPage: PageMetadata = {
  title: "Booking confirmation | Nakshatra",
  description:
    "Review the status and next steps for your Kundli consultation with Nilima Sawane.",
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
  if (pathname === "/booking-confirmed" || pathname === "/booking-confirmed/") {
    return "booking-confirmation" as const;
  }
  return "not-found" as const;
}

export function getPageMetadata(pathname: string): PageMetadata {
  const routeKind = getRouteKind(pathname);

  if (routeKind === "booking") return bookingPage;
  if (routeKind === "booking-confirmation") return bookingConfirmationPage;
  if (routeKind === "not-found") return notFoundPage;
  return homePage;
}

export default function App({ pathname }: AppProps) {
  const [browserPathname, setBrowserPathname] = useState(() => currentPathname(pathname));

  useEffect(() => {
    if (pathname !== undefined) {
      setBrowserPathname(pathname);
      return;
    }
    const followBrowserHistory = () => setBrowserPathname(window.location.pathname);
    window.addEventListener("popstate", followBrowserHistory);
    return () => window.removeEventListener("popstate", followBrowserHistory);
  }, [pathname]);

  const activePathname = pathname ?? browserPathname;
  const routeKind = getRouteKind(activePathname);
  const page = getPageMetadata(activePathname);

  return (
    <BaseLayout description={page.description} title={page.title}>
      {routeKind === "booking" ? (
        <BookPage />
      ) : routeKind === "booking-confirmation" ? (
        <BookingConfirmationPage />
      ) : routeKind === "not-found" ? (
        <NotFoundPage />
      ) : (
        <>
          <Hero />
          <MeetNilima />
          <Reviews />
          <ServiceCards />
          <Preparation />
          <FAQ />
          <Contact />
        </>
      )}
    </BaseLayout>
  );
}
