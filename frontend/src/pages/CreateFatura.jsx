import { useState, useEffect } from "react";
import api from "../api";
import "../styles/CreateFatura.css";
import Header from "../components/Header";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

function InserirFatura() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.previewUrl));
    };
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    
    if (selectedFiles.length) {
      const newFiles = Array.from(selectedFiles).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        error: null
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const uploadFile = async (fileObj) => {
    const formData = new FormData();
    formData.append("file", fileObj.file);

    try {
      await api.post("/api/faturas/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("access")}`,
        },
      });
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.detail || err.message 
      };
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert("Por favor, selecione pelo menos um arquivo.");
      return;
    }

    setLoading(true);

    let filesToProcess = [...files];
    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        filesToProcess[i] = { ...filesToProcess[i], status: 'uploading', error: null };
        setFiles([...filesToProcess]);

        const result = await uploadFile(filesToProcess[i]);
        
        if (result.success) {
          filesToProcess[i] = { ...filesToProcess[i], status: 'success' };
        } else {
          filesToProcess[i] = { ...filesToProcess[i], status: 'error', error: result.error };
        }
        setFiles([...filesToProcess]);
      } catch (err) {
        filesToProcess[i] = { ...filesToProcess[i], status: 'error', error: "Erro inesperado" };
        setFiles([...filesToProcess]);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="invoice-form-container">
        <h2>Inserir Documentos</h2>
        <form onSubmit={handleUpload}>
          <label>Arquivos (PDF)</label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange} 
            multiple
          />
          <button type="submit" disabled={loading || files.length === 0}>
            {loading ? "Enviando..." : `Enviar ${files.length} Documentos`}
          </button>
          
          <div className="thumbnails-container">
            {files.length > 0 ? (
              <Worker workerUrl={`/node_modules/pdfjs-dist/build/pdf.worker.min.js`}>
                {files.map((fileObj, index) => (
                  <div 
                    key={index} 
                    className="thumbnail-card"
                    onClick={() => setSelectedFile(fileObj)}
                  >
                    <div className="thumbnail-content">
                      <Viewer
                        fileUrl={fileObj.previewUrl}
                        initialPage={0}
                        defaultScale={0.3}
                      />
                    </div>
                    <div className="thumbnail-footer">
                      <span>Documento {index + 1}</span>
                      <div className="status-indicator">
                        {fileObj.status === 'uploading' && '⏳'}
                        {fileObj.status === 'success' && '✅'}
                        {fileObj.status === 'error' && `❌`}
                      </div>
                    </div>
                  </div>
                ))}
              </Worker>
            ) : (
              <p>Nenhum documento selecionado.</p>
            )}
          </div>
        </form>

        {selectedFile && (
          <div className="pdf-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Visualização do Documento</h3>
                <button 
                  className="close-button"
                  onClick={() => setSelectedFile(null)}
                >
                  ×
                </button>
              </div>
              <Worker workerUrl={`/node_modules/pdfjs-dist/build/pdf.worker.min.js`}>
                <Viewer
                  fileUrl={selectedFile.previewUrl}
                  initialPage={0}
                  className="full-viewer"
                />
              </Worker>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default InserirFatura;