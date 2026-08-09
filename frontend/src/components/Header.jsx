import { Truck } from "lucide-react";
import logo from "../assets/logo.png";
function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <img src={logo} alt="Logo" className="header-logo" />
        <h1 className="header-title">My Fleet Management </h1>
      </div>
      {/* <p className="header-subtitle">Live Fleet Asset Tracking</p> */}
    </header>
  );
}

export default Header;
