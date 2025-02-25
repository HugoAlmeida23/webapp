import { useState } from "react";
import "../styles/Header.css";
import simpleLogo from "../assets/simplelogo.png";

function Header() {
  const [documentosDropdownOpen, setDocumentosDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // Sidebar collapsed by default

  // Toggle sidebar expansion/collapse
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Expand the sidebar when hovering
  const handleMouseEnter = () => {
    setCollapsed(false);
  };

  // Collapse the sidebar when mouse leaves
  const handleMouseLeave = () => {
    setCollapsed(true);
  };

  return (
    <div className={collapsed ? "collapsed" : ""}>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >

        
        <a href="/" className="logo-wrapper">
          <img
            src={simpleLogo}
            alt="UI Kit Logo"
            style={{ width: "24px", height: "24px" }}
          />
          <span className="brand-name">TrofTech</span>
        </a>
        
        <div className="separator"></div>
        
        <ul className="menu-items">
          <li>
            <a href="./">
              <span className="icon fas fa-tachometer-alt"></span>
              <span className="item-name">Dashboard</span>
            </a>
            <div className="tooltip">Dashboard</div>
          </li>
          <li>
            <a href="./faturas">
              <span className="icon fas fa-file-invoice"></span>
              <span className="item-name">Gestor de Documentos</span>
            </a>
            <div className="tooltip">Gestor de Documentos</div>
          </li>
          <li>
            <a href="./inserirFatura">
              <span className="icon fas fa-file-upload"></span>
              <span className="item-name">Inserir Documentos</span>
            </a>
            <div className="tooltip">Inserir Documentos</div>
          </li>
        </ul>
      </aside>
    
    </div>
  );
}

export default Header;