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
      <aside onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button class="menu-btn fa fa-chevron-left"></button>
        <a href="/" class="logo-wrapper">
          <span class="fa-brands fa-uikit"></span>
          <span class="brand-name">Troftech</span>
        </a>
        <div class="separator"></div>
        <ul class="menu-items">
          <li>
            <a href="./">
              <span class="icon fa fa-house"></span>
              <span class="item-name">Home</span>
            </a>
            <span class="tooltip">Home</span>
          </li>
          <li>
            <a href="./faturas">
              <span class="icon fa fa-chart-line"></span>
              <span class="item-name">Gestor de Documentos</span>
            </a>
            <span class="tooltip">Gestor de Documentos</span>
          </li>
          <li>
            <a href="./inserirFatura">
              <span class="icon fa fa-chart-simple"></span>
              <span class="item-name">Inserir Documentos</span>
            </a>
            <span class="tooltip">Inserir Documentos</span>
          </li>
        </ul>
      </aside>
    </div>
  );
}

export default Header;
