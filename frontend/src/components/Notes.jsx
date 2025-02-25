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
        <svg
                      class="icon-trash"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 28 40"
                      width="40"
                      height="40"
                    >
                      <path
                        class="trash-lid"
                        d="M6 15l4 0 0-3 8 0 0 3 4 0 0 2 -16 0zM12 14l4 0 0 1 -4 0z"
                      />
                      <path
                        class="trash-can"
                        d="M8 17h2v9h8v-9h2v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z"
                      />
                    </svg>
        </button>
    </div>);
}

export default Note