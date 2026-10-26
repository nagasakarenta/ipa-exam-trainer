import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Drill } from "./pages/Drill";
import { Mock } from "./pages/Mock";
import { Review } from "./pages/Review";
import { Stats } from "./pages/Stats";
import { Settings } from "./pages/Settings";
import { ProgressProvider } from "./state/store";

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="drill" element={<Drill />} />
            <Route path="mock" element={<Mock />} />
            <Route path="review" element={<Review />} />
            <Route path="stats" element={<Stats />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProgressProvider>
  );
}
