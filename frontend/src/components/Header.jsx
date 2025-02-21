import { useState } from "react";
import "../styles/Header.css";
import simpleLogo from "../assets/simplelogo.png";

function Header() {
  const [documentosDropdownOpen, setDocumentosDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // State for sidebar collapse
  const [minimized, setMinimized] = useState(false); // State for minimization of sidebar

  // Toggle the sidebar collapse state
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    setMinimized(!minimized); // Toggle minimization of the sidebar
  };

  // Toggle the documentos dropdown
  const toggleDocumentosDropdown = () => {
    setDocumentosDropdownOpen(!documentosDropdownOpen);
  };

  return (
    <header className={`header bg-black ${collapsed ? "collapsed" : ""}`}>
      <aside>
        <button
          className={`menu-btn fa ${
            collapsed ? "fa-chevron-right" : "fa-chevron-left"
          }`}
          onClick={toggleCollapse}
        ></button>
        <a href="/" className="logo-wrapper">
          <img
            src={simpleLogo}
            alt="UI Kit Logo"
            style={{ width: "24px", height: "24px" }} // Adjust size as needed
          />
          <span className="brand-name">TrofTech</span>
        </a>
        <div className="separator"></div>
        <ul className="menu-items">
          {/* Dashboard */}
          <li>
            <a href="./" onClick={toggleCollapse}>
              <span className="icon fa fa-layer-group"></span>
              <span className="item-name">Dashboard</span>
            </a>
            <span className="tooltip">Dashboard</span>
          </li>

          {/* Documentos (with Submenu) */}
          <li
            className={`menu-item docs ${documentosDropdownOpen ? "open" : ""}`}
            onClick={toggleDocumentosDropdown}
          >
            <a href="#">
              <span className="icon fa fa-file-alt"></span>
              <span className="item-name doc">Documentos</span>
              <span
                className={
                  documentosDropdownOpen
                    ? "fa-solid fa-square-caret-up"
                    : "fa-solid fa-square-caret-down"
                }
              ></span>
            </a>
            <span className="tooltip doc">Documentos</span>
            {documentosDropdownOpen && (
              <ul className="submenu">
                <li>
                  <a className="submenu-items" href="./faturas">
                    <i className="fa fa-folder-open"></i> Gestor de Documentos
                  </a>
                </li>
                <li>
                  <a className="submenu-items" href="./inserirFatura">
                    <i className="fa fa-upload"></i> Inserir Documentos
                  </a>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </aside>
    </header>
  );
}

export default Header;
