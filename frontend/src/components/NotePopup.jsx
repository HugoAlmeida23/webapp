import React, { useState } from "react";
import "../styles/NotePopup.css";  // Adicione um arquivo CSS para o estilo do popup

function NotePopup({ isOpen, closePopup, createNote }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    createNote({ title, content });
    closePopup();  // Fecha o popup após criar a nota
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
          <button type="submit">Criar Nota</button>
          <button type="button" onClick={closePopup}>
            Fechar
          </button>
        </form>
      </div>
    </div>
  ) : null;
}

export default NotePopup;
