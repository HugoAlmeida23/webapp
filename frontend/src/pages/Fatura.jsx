import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/Fatura.css";
import Header from "../components/Header";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import {
  FaTrashAlt,
  FaPlus,
  FaSave,
  FaSearch,
  FaFilter,
  FaTimes,
  FaInfo,
  FaFileInvoice,
  FaPrint,
  FaSearchMinus,
  FaSearchPlus,
  FaExpand,
  FaCompress,
  FaUndo,
} from "react-icons/fa";
import Note from "../components/Notes";
import NotePopup from "../components/NotePopup";
import { pdfjs } from "react-pdf";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { toast } from "react-toastify";

function Fatura() {
  const [notes, setNotes] = useState([]);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [faturas, setFaturas] = useState([]);
  const [filteredFaturas, setFilteredFaturas] = useState([]);
  const [entidade, setEntidade] = useState("");
  const [nif, setNif] = useState("");
  const [tipo, setTipo] = useState("");
  const [classificacao, setClassificacao] = useState("");
  const [dataInicio, setdataInicio] = useState("");
  const [dataTermino, setdataTermino] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [entidadesDisponiveis, setEntidadesDisponiveis] = useState([]);
  const [faturaId, setFaturaId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Function to handle zoom with better precision
  const handleZoom = (newScale) => {
    setScale(Math.round(newScale * 100) / 100);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      handleZoom(1.2)
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
      handleZoom(1)
    }
  };

  // Create a key that changes when scale changes to force re-render
  const viewerKey = `pdf-viewer-${scale}`;

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

  useEffect(() => {
    fetchFaturas();
    fetchEntidades();
    getNotes();

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  const getNotes = () => {
    api
      .get("/api/notes/")
      .then((res) => res.data)
      .then((data) => {
        setNotes(data);
      })
      .catch((err) => toast.error("Erro ao carregar notas"));
  };

  const deleteNote = (id) => {
    api
      .delete(`/api/notes/delete/${id}/`)
      .then((res) => {
        toast.success("Nota eliminada com sucesso!");
        getNotes();
      })
      .catch((err) => {
        toast.error("Erro ao eliminar nota!");
      });
  };

  const createNote = ({ title, content, fatura_id }) => {
    api
      .post("/api/notes/", { title, content, fatura_id })
      .then((res) => {
        if (res.status === 201) {
          toast.success("Nota criada com sucesso! ✅");
          getNotes();
        }
      })
      .catch((err) => {
        toast.error("Erro ao criar nota ❌");
      });
  };

  const fetchFaturas = () => {
    setLoading(true);
    api
      .get("/api/faturas/")
      .then((res) => {
        setFaturas(res.data);
        setFilteredFaturas(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Erro ao buscar faturas: " + err);
        setLoading(false);
      });
  };

  const fetchEntidades = () => {
    api
      .get("/api/faturas/entidades/")
      .then((res) => {
        setEntidadesDisponiveis(res.data);
      })
      .catch((err) => {
        toast.error("Erro ao buscar entidades: " + err);
      });
  };

  const deleteFatura = (id) => {
    api
      .delete(`/api/faturas/delete/${id}/`)
      .then(() => {
        toast.success("Documento eliminado!");
        fetchFaturas();
      })
      .catch((err) => {
        toast.error("Erro ao eliminar o documento!");
      });
  };

  const selectFatura = (fatura) => {
    setSelectedFatura(fatura);
    if (fatura.file_url) {
      setFileUrl(fatura.file_url);
    }
    setFaturaId(fatura.id);
  };

  const validateFatura = (data) => {
    const errors = [];

    if (!data.numero_fatura) errors.push("Número da Fatura é obrigatório");
    if (!data.entidade) errors.push("Entidade é obrigatória");

    const numericFields = [
      "iva_6",
      "iva_23",
      "total_iva",
      "total_sem_iva",
      "total_fatura",
    ];
    numericFields.forEach((field) => {
      if (data[field] && isNaN(parseFloat(data[field]))) {
        errors.push(`${field} deve ser um número válido`);
      }
    });

    if (data.data && !/^\d{4}-\d{2}-\d{2}$/.test(data.data)) {
      errors.push("Data deve estar no formato YYYY-MM-DD");
    }

    return errors;
  };

  const updateFatura = (faturaId, selectedFatura) => {
    api
      .put(`/api/faturas/update/${faturaId}/`, selectedFatura)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Documento atualizado com sucesso! ✅");
          fetchFaturas();
        }
      })
      .catch((err) => {
        console.error("Error details:", err);
        toast.error("Erro ao atualizar o documento ❌");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateFatura(selectedFatura);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        toast.error(error);
      });
      return;
    }

    updateFatura(faturaId, selectedFatura);
  };

  const handleTipoChange = (e) => {
    const { value } = e.target;
    setTipo(value);
    handleSearch();
  };

  const handleClassificacaoChange = (e) => {
    setClassificacao(e.target.value);
    handleSearch();
  };

  const uniqueTipo = [...new Set(faturas.map((fatura) => fatura.tipo))];
  const uniqueClassificacoes = [
    ...new Set(faturas.map((fatura) => fatura.classificacao).filter(Boolean)),
  ];

  const handleNIFChange = (e) => {
    setNif(e.target.value);
  };

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("pt-PT", options);
  };

  const handleDataInicioChange = (e) => setdataInicio(e.target.value);
  const handleDataTerminoChange = (e) => setdataTermino(e.target.value);

  const handleClear = () => {
    setEntidade("");
    setTipo("");
    setNif("");
    setClassificacao("");
    setdataInicio("");
    setdataTermino("");
    setSearchTerm("");
    setFilteredFaturas(faturas);
  };

  const handleSearch = () => {
    let filtered = [...faturas];

    if (entidade) {
      filtered = filtered.filter((fatura) => fatura.entidade === entidade);
    }

    if (tipo) {
      filtered = filtered.filter((fatura) => fatura.tipo === tipo);
    }

    if (nif) {
      filtered = filtered.filter((fatura) => fatura.nif?.includes(nif));
    }

    if (classificacao) {
      filtered = filtered.filter(
        (fatura) => fatura.classificacao === classificacao
      );
    }

    if (dataInicio && dataTermino) {
      filtered = filtered.filter((fatura) => {
        const faturaData = new Date(fatura.data);
        const inicio = new Date(dataInicio);
        const termino = new Date(dataTermino);
        return faturaData >= inicio && faturaData <= termino;
      });
    } else if (dataInicio) {
      filtered = filtered.filter((fatura) => {
        const faturaData = new Date(fatura.data);
        const inicio = new Date(dataInicio);
        return faturaData >= inicio;
      });
    } else if (dataTermino) {
      filtered = filtered.filter((fatura) => {
        const faturaData = new Date(fatura.data);
        const termino = new Date(dataTermino);
        return faturaData <= termino;
      });
    }

    setFilteredFaturas(filtered);
  };

  const filteredEntidades = entidadesDisponiveis.filter((ent) =>
    ent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldChange = (field) => (e) => {
    setSelectedFatura((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const toggleRowSelection = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleDetailsPanel = () => {
    setIsDetailsPanelVisible(!isDetailsPanelVisible);
  };

  return (
    <div className="fatura-main-container">
      <Header />
      <div className="split-layout">
        {/* Documents List Panel - 50% width */}
        <div className="documents-panel">
          <div className="search-toolbar">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Filtrar resultados..."
                className="search-input"
                onChange={(e) => {
                  const term = e.target.value.toLowerCase();
                  setFilteredFaturas(
                    faturas.filter(
                      (f) =>
                        f.entidade?.toLowerCase().includes(term) ||
                        f.numero_fatura?.toLowerCase().includes(term) ||
                        f.classificacao?.toLowerCase().includes(term)
                    )
                  );
                }}
              />
              <button className="search-button">
                <FaSearch />
              </button>
              <button
                className="filter-toggle"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              >
                {isFiltersVisible ? <FaFilter /> : <FaFilter />}
              </button>
            </div>
          </div>

          {isFiltersVisible && (
            <div className="filter-container">
              <form
                className="filter-form"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="filter-grid">
                  <div className="field-group">
                    <label>ENTIDADE</label>
                    <div className="autocomplete-wrapper" ref={wrapperRef}>
                      <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                      />

                      {isDropdownOpen && filteredEntidades.length > 0 && (
                        <div className="autocomplete-dropdown">
                          {filteredEntidades.map((ent, index) => (
                            <div
                              key={index}
                              className="dropdown-option"
                              onClick={() => {
                                setEntidade(ent);
                                setSearchTerm(ent);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {ent}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="field-group">
                    <label>NIF</label>
                    <input
                      type="text"
                      name="nif"
                      value={nif}
                      onChange={handleNIFChange}
                      placeholder="Digite o NIF"
                    />
                  </div>

                  <div className="field-group">
                    <label>CLASSIFICAÇÃO</label>
                    <select
                      name="classificacao"
                      value={classificacao}
                      onChange={handleClassificacaoChange}
                    >
                      <option value="">Todas as classificações</option>
                      {uniqueClassificacoes.map((classif, index) => (
                        <option key={index} value={classif}>
                          {classif}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>DOCUMENTO</label>
                    <select
                      name="tipo"
                      value={tipo}
                      onChange={handleTipoChange}
                    >
                      <option value="">Selecione um tipo de documento</option>
                      {uniqueTipo.map((tipo, index) => (
                        <option key={index} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>INÍCIO</label>
                    <input
                      type="date"
                      name="dataInicio"
                      value={dataInicio}
                      onChange={handleDataInicioChange}
                    />
                  </div>

                  <div className="field-group">
                    <label>FIM</label>
                    <input
                      type="date"
                      name="dataTermino"
                      value={dataTermino}
                      onChange={handleDataTerminoChange}
                    />
                  </div>
                </div>

                <div className="filter-buttons">
                  <button
                    className="btn-search"
                    type="submit"
                    onClick={handleSearch}
                  >
                    Aplicar Filtros
                  </button>
                  <button
                    className="btn-clear"
                    type="button"
                    onClick={handleClear}
                  >
                    Limpar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="faturas-table-container">
            <table className="faturas-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filteredFaturas.map((f) => f.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </th>
                  <th>Data</th>
                  <th>Fornecedor</th>
                  <th>Nº Fatura</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      <div className="loading-spinner"></div>
                    </td>
                  </tr>
                ) : (
                  filteredFaturas.map((fatura) => (
                    <tr
                      key={fatura.id}
                      className={
                        selectedFatura?.id === fatura.id ? "selected-row" : ""
                      }
                      onClick={() => selectFatura(fatura)}
                    >
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(fatura.id)}
                          onChange={() => toggleRowSelection(fatura.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>{formatDate(fatura.data)}</td>
                      <td>{fatura.entidade}</td>
                      <td>{fatura.numero_fatura}</td>
                      <td>
                        {fatura.total_fatura
                          ? `${fatura.total_fatura.toLocaleString("pt-PT")} €`
                          : ""}
                      </td>
                      <td>{fatura.tipo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Viewer Panel - 50% width */}
        <div className="document-viewer-panel">
          <div className="viewer-header">
            {selectedFatura && (
              <>
                <div className="doc-info">
                  <h3>{selectedFatura.numero_fatura}</h3>
                  <p>
                    {selectedFatura.entidade} •{" "}
                    {formatDate(selectedFatura.data)}
                  </p>
                </div>
                <div className="viewer-actions">
                  {/* Print button */}
                  <button
                    className="print-btn"
                    onClick={() => window.print()}
                    title="Imprimir documento"
                    aria-label="Imprimir documento"
                  >
                    <FaPrint />
                  </button>
                  <button
                    className={`toggle-details-btn ${
                      isDetailsPanelVisible ? "active" : ""
                    }`}
                    onClick={toggleDetailsPanel}
                    title="Ver detalhes"
                    aria-label="Ver ou esconder detalhes do documento"
                    aria-expanded={isDetailsPanelVisible}
                  >
                    <FaInfo />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="viewer-container" ref={containerRef}>
            {selectedFatura ? (
              fileUrl && fileUrl.endsWith(".pdf") ? (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <div className="pdf-toolbar">
                    <div className="tool-group">
                      <button
                        onClick={() => handleZoom(Math.max(0.5, scale - 0.1))}
                        className="tool-button"
                        title="Diminuir zoom"
                        aria-label="Diminuir zoom"
                      >
                        <FaSearchMinus />
                      </button>

                      <div className="zoom-display">
                        <span>{Math.round(scale * 100)}%</span>
                      </div>

                      <button
                        onClick={() => handleZoom(Math.min(3, scale + 0.1))}
                        className="tool-button"
                        title="Aumentar zoom"
                        aria-label="Aumentar zoom"
                      >
                        <FaSearchPlus />
                      </button>

                      <button
                        onClick={() => handleZoom(1)}
                        className="tool-button"
                        title="Redefinir zoom"
                        aria-label="Redefinir zoom para 100%"
                      >
                        <FaUndo />
                      </button>
                    </div>

                    <div className="tool-group">
                      <button
                        onClick={toggleFullscreen}
                        className="tool-button"
                        title={
                          isFullscreen ? "Sair de tela cheia" : "Tela cheia"
                        }
                        aria-label={
                          isFullscreen ? "Sair de tela cheia" : "Tela cheia"
                        }
                      >
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                      </button>
                    </div>
                  </div>

                  {/* Viewer container */}
                  <div key={viewerKey} className="pdf-container">
                    <Viewer
                      fileUrl={fileUrl}
                      theme={{
                        theme: "darkblue",
                      }}
                      defaultScale={scale}
                      onDocumentLoad={() => {
                        // Reset scroll position when scale changes
                        if (containerRef.current) {
                          const container =
                            containerRef.current.querySelector(
                              ".rpv-core__viewer"
                            );
                          if (container) {
                            container.scrollLeft = 0;
                          }
                        }
                      }}
                    />
                  </div>
                </Worker>
              ) : (
                <div className="no-preview" role="alert">
                  <FaFileInvoice size={48} />
                  <p>Selecione um documento válido.</p>
                </div>
              )
            ) : (
              <div className="no-preview" role="alert">
                <FaFileInvoice size={48} />
                <p>Selecione uma fatura para ver o documento.</p>
              </div>
            )}
          </div>

          {/* Sliding Details Panel */}
          {selectedFatura && (
            <div
              className={`document-details-sidebar ${
                isDetailsPanelVisible ? "visible" : ""
              }`}
              role="complementary"
              aria-label="Detalhes do documento"
              tabIndex={isDetailsPanelVisible ? 0 : -1}
            >
              <div className="sidebar-header">
                <h3 id="details-panel-title">Detalhes do Documento</h3>
                <button
                  className="close-sidebar"
                  onClick={toggleDetailsPanel}
                  aria-label="Fechar painel de detalhes"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="sidebar-tabs" role="tablist">
                <button
                  className="tab-btn active"
                  role="tab"
                  aria-selected="true"
                  id="tab-info"
                  aria-controls="panel-info"
                >
                  Informação
                </button>
                <button
                  className="tab-btn"
                  role="tab"
                  aria-selected="false"
                  id="tab-notes"
                  aria-controls="panel-notes"
                >
                  Notas
                </button>
              </div>

              <div className="sidebar-content">
                <div
                  className="invoice-form"
                  role="tabpanel"
                  id="panel-info"
                  aria-labelledby="tab-info"
                >
                  <div className="form-section">
                    <h4>Dados Gerais</h4>
                    <div className="form-group">
                      <label htmlFor="nif-input">NIF</label>
                      <input
                        id="nif-input"
                        type="text"
                        value={selectedFatura.nif || ""}
                        onChange={handleFieldChange("nif")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="entidade-input">Entidade</label>
                      <input
                        id="entidade-input"
                        type="text"
                        value={selectedFatura.entidade || ""}
                        onChange={handleFieldChange("entidade")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pais-input">País</label>
                      <input
                        id="pais-input"
                        type="text"
                        value={selectedFatura.pais || ""}
                        onChange={handleFieldChange("pais")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="data-input">Data</label>
                      <input
                        id="data-input"
                        type="date"
                        value={selectedFatura.data || ""}
                        onChange={handleFieldChange("data")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="numero-fatura-input">
                        Número da Fatura
                      </label>
                      <input
                        id="numero-fatura-input"
                        type="text"
                        value={selectedFatura.numero_fatura || ""}
                        onChange={handleFieldChange("numero_fatura")}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Valores</h4>
                    <div className="form-group">
                      <label htmlFor="iva6-input">IVA 6%</label>
                      <input
                        id="iva6-input"
                        type="number"
                        value={selectedFatura.iva_6 || ""}
                        onChange={handleFieldChange("iva_6")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="iva23-input">IVA 23%</label>
                      <input
                        id="iva23-input"
                        type="number"
                        value={selectedFatura.iva_23 || ""}
                        onChange={handleFieldChange("iva_23")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="total-iva-input">Total IVA</label>
                      <input
                        id="total-iva-input"
                        type="number"
                        value={selectedFatura.total_iva || ""}
                        onChange={handleFieldChange("total_iva")}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="total-sem-iva-input">Total s/IVA</label>
                      <input
                        id="total-sem-iva-input"
                        type="number"
                        value={
                          selectedFatura.total_fatura -
                          (selectedFatura.total_iva || 0)
                        }
                        onChange={(e) => {
                          const totalFatura =
                            parseFloat(e.target.value) +
                            (selectedFatura.total_iva || 0);
                          setSelectedFatura({
                            ...selectedFatura,
                            total_fatura: totalFatura,
                          });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="valor-final-input">Valor Final</label>
                      <input
                        id="valor-final-input"
                        type="number"
                        value={selectedFatura.total_fatura || ""}
                        onChange={handleFieldChange("total_fatura")}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Classificação</h4>
                    <div className="form-group">
                      <label htmlFor="classificacao-select">
                        Classificação
                      </label>
                      <select
                        id="classificacao-select"
                        value={selectedFatura.classificacao || ""}
                        onChange={handleFieldChange("classificacao")}
                      >
                        <option value="">Selecione a Classificação</option>
                        <option value="72 - Prestação de Serviços">
                          72 - Prestação de Serviços
                        </option>
                        <option value="72.1 - Consultoria Empresarial">
                          72.1 - Consultoria Empresarial
                        </option>
                        <option value="72.2 - Consultoria Fiscal">
                          72.2 - Consultoria Fiscal
                        </option>
                        <option value="75 - Despesas Operacionais">
                          75 - Despesas Operacionais
                        </option>
                        <option value="76 - Fornecimentos e Serviços Externos">
                          76 - Fornecimentos e Serviços Externos
                        </option>
                        <option value="77 - Impostos e IVA">
                          77 - Impostos e IVA
                        </option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="tipo-select">Tipo</label>
                      <select
                        id="tipo-select"
                        value={selectedFatura.tipo || ""}
                        onChange={handleFieldChange("tipo")}
                      >
                        <option value="Fatura">Fatura</option>
                        <option value="Fatura Simplificada">
                          Fatura Simplificada
                        </option>
                        <option value="Comprovante de Venda">
                          Comprovante de Venda
                        </option>
                        <option value="Nota de Débito">Nota de Débito</option>
                        <option value="Nota de Crédito">Nota de Crédito</option>
                        <option value="Recibo">Recibo</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="descricao-textarea">Descrição</label>
                      <textarea
                        id="descricao-textarea"
                        value={selectedFatura.description || ""}
                        onChange={handleFieldChange("description")}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-save"
                      onClick={handleSubmit}
                      aria-label="Guardar alterações"
                    >
                      <FaSave />
                      <span>Guardar</span>
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => deleteFatura(selectedFatura.id)}
                      aria-label="Eliminar fatura"
                    >
                      <FaTrashAlt />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                <div
                  className="notes-section"
                  style={{ display: "none" }}
                  role="tabpanel"
                  id="panel-notes"
                  aria-labelledby="tab-notes"
                >
                  <div className="notes-header">
                    <h4>Notas</h4>
                    <button
                      className="btn-add-note"
                      onClick={() => setPopupOpen(true)}
                      aria-label="Adicionar nova nota"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  <div className="notes-list">
                    {notes
                      .filter((note) => note.fatura_id === selectedFatura.id)
                      .map((note) => (
                        <Note key={note.id} note={note} onDelete={deleteNote} />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isPopupOpen && selectedFatura && (
            <NotePopup
              isOpen={isPopupOpen}
              closePopup={() => setPopupOpen(false)}
              createNote={createNote}
              fatura_id={selectedFatura.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Fatura;
