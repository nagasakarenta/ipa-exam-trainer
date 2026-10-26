import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useProgress } from "../state/context";
import { sortByUrgency } from "../lib/srs";

const LINKS = [
  { to: "/", label: "ホーム" },
  { to: "/drill", label: "分野別ドリル" },
  { to: "/mock", label: "模擬試験" },
  { to: "/review", label: "復習" },
  { to: "/stats", label: "学習記録" },
  { to: "/settings", label: "設定" },
];

export function Layout() {
  const { progress } = useProgress();
  const location = useLocation();
  const due = sortByUrgency(Object.values(progress.cards)).length;
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">IPA</span>
          <span>試験トレーナー</span>
        </div>
        <nav className="nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              <span>{l.label}</span>
              {l.to === "/review" && due > 0 && <span className="badge">{due}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="foot">
          ITパスポート・基本情報技術者
          <br />
          学習データはこの端末に保存されます
        </div>
      </aside>
      <main className="main">
        <div className="page" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
