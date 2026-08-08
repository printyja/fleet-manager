import { Truck } from "lucide-react";

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Truck size={28} color="white" />
        <h1 className="header-title">Association JP Enterprises Inc</h1>
      </div>
      <p className="header-subtitle">Live Fleet Asset Tracking</p>
    </header>
  );
}

export default Header;
