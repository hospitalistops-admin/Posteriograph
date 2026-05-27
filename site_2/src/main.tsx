import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { useIsMobile } from "./shared/useIsMobile";
import "./styles.css";

const App = lazy(() => import("./App"));
const MobileApp = lazy(() => import("./mobile/MobileApp"));

function Root() {
  const isMobile = useIsMobile();
  return (
    <Suspense fallback={null}>
      {isMobile ? <MobileApp /> : <App />}
    </Suspense>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
