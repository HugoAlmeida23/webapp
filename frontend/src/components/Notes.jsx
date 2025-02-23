import React from "react";
import "../styles/Note.css"
import { FaTrashAlt } from "react-icons/fa"; 
function Note({note,onDelete}) {
    const formattedDate = new Date(note.created_at).toLocaleDateString("en-US")

    return (<div className="note-container">
        <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
      </head>
        <p className="note-title">{note.title}</p>
        <p className="note-content">{note.content}</p>
        <p className="note-date">{formattedDate}</p>
        <button className="delete-button-note" onClick={() => onDelete(note.id)}>
        <FaTrashAlt />
        </button>
    </div>);
}

export default Note