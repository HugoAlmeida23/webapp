import React, { useState } from "react";
import "../styles/NotePopup.css"; 

function NotePopup({ isOpen, closePopup, createNote, fatura_id }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!fatura_id) {
      alert("Erro: Nenhuma fatura selecionada.");
      return;
    }

    createNote({ title, content, fatura_id }); // Use fatura_id from props
    closePopup();
  };

  return isOpen ? (
    <div className="popup-overlay">
      <div className="popup-container">
        <h2>Nova Nota</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="button-container">
          <button className="button-33 popup" type="submit">Criar Nota</button>
          <button className="button-33 popup" type="button" onClick={closePopup}>
            Fechar
          </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
}

export default NotePopup;
