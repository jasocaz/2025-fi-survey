"use client";

export function TopNav() {
  return (
    <nav className="topnav" aria-label="Report navigation">
      <div className="topnav__inner">
        <a className="topnav__brand" href="#hero">
          <span className="topnav__mark" aria-hidden="true" />
          <span>2025 FI Survey</span>
        </a>

        <div className="topnav__links">
          <a href="#methodology">Methodology</a>
          <a href="#demographics">Who responded</a>
          <a href="#networth">Net worth</a>
          <a href="#fiplan">FI targets</a>
          <a href="#allocation">Allocation</a>
          <a href="#alreadyfi">Already FI</a>
        </div>

        <a className="topnav__cta" href="#networth">
          Read the report
        </a>
      </div>
    </nav>
  );
}
