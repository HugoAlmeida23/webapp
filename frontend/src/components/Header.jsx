import blacklogo from "../assets/logoblack.png"
import { useState } from "react";
import "../styles/Header.css"

function Header() {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return(
        <header className="header bg-black">
                <div className="logo-container">
                <a href="./">
                  <img className="layoutlogo" src={blacklogo} alt="Company Logo" />
                </a>
                </div>
        
                <div className="header-links">
                  <a href="./" className="header-link">Dashboard</a>
                  <div className="dropdown">
                    <a className="header-link" onClick={toggleDropdown}>Documentos</a>
                    <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                        <a href="./faturas" className="dropdown-item">Gestor de Documentos</a>
                        <a href="./inserirFatura" className="dropdown-item">Inserir Documentos</a>
                    </div>
                  </div>
                  <a href="./ajuda" className="header-link">Ajuda</a>
                  <a href="./logout" className="header-link">Sair</a>
                </div>
              </header>
    )
}

export default Header;
