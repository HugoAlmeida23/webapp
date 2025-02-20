import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/Fatura.css";
import Header from "../components/Header";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { FaTrashAlt } from "react-icons/fa";
import Note from "../components/Notes";
import NotePopup from "../components/NotePopup";

function Fatura() {
  const [notes, setNotes] = useState([]);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [faturas, setFaturas] = useState([]);
  const [filteredFaturas, setFilteredFaturas] = useState([]);
  const [filterField, setFilterField] = useState(""); // Estado para armazenar o campo do filtro (ex. "entidade", "data", etc.)
  const [entidade, setEntidade] = useState(""); // Estado para armazenar o valor do filtro
  const [nif, setNif] = useState(""); // Estado para
  const [tipo, setTipo] = useState(""); // Estado]
  const [dataInicio, setdataInicio] = useState(""); //
  const [dataTermino, setdataTermino] = useState(""); //
  const [loading, setLoading] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [entidadesDisponiveis, setEntidadesDisponiveis] = useState([]);
  const [content, setContent] = useState([]);
  const [faturaId, setFaturaId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchFaturas();
    fetchEntidades();
    getNotes();
    console.log("Viewport Width:", window.innerWidth);
    console.log("Viewport Height:", window.innerHeight);
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMinimize = () => {
    setIsMinimized((prevState) => !prevState);
  };

  const getNotes = () => {
    api
      .get("/api/notes/")
      .then((res) => res.data)
      .then((data) => {
        setNotes(data);
        console.log(data);
      })
      .catch((err) => alert(err));
  };

  const deleteNote = (id) => {
    api
      .delete(`/api/notes/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) alert("Note deleted!");
        else alert("Failed to delete note.");
        getNotes();
      })
      .catch((error) => alert(error));
  };

  const createNote = ({ title, content }) => {
    api
      .post("/api/notes/", { title, content })
      .then((res) => {
        if (res.status === 201) alert("Note created!");
        getNotes();
      })
      .catch((err) => alert(err));
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
        alert("Erro ao buscar faturas: " + err);
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
        alert("Erro ao buscar entidades: " + err);
      });
  };

  const deleteFatura = (id) => {
    api
      .delete(`/api/faturas/delete/${id}/`)
      .then(() => {
        alert("Fatura deletada!");
        fetchFaturas();
      })
      .catch((err) => alert("Erro ao deletar fatura: " + err));
  };

  const selectFatura = (fatura) => {
    setSelectedFatura(fatura); // Atualiza a fatura selecionada
    if (fatura.file_url) {
      setFileUrl(fatura.file_url); // Atualiza o URL do arquivo
    }
    setFaturaId(fatura.id); // Atualiza o estado de faturaId
  };

  // Função para aplicar o filtro com base no campo e valor selecionados
  const filterFaturas = () => {
    const filtered = faturas.filter((fatura) => {
      if (!filterField || !filterValue) return true; // Se nenhum filtro estiver aplicado, retorna todas as faturas
      return fatura[filterField]
        ? fatura[filterField]
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        : false;
    });
    setFilteredFaturas(filtered);
  };

  const handleEntityChange = (e) => {
    const { value } = e.target;
    setEntidade(value); // Update the entity state
    handleSearch(); // Call the search function when entity changes
  };

  const handleTipoChange = (e) => {
    const { value } = e.target;
    setTipo(value); // Update the entity state
    handleSearch(); // Call the search function when entity changes
  };

  const uniqueEntidades = [
    ...new Set(faturas.map((fatura) => fatura.entidade)),
  ];

  const uniqueTipo = [...new Set(faturas.map((fatura) => fatura.tipo))];

  const handleNIFChange = (e) => {
    setNif(e.target.value);
    filterFaturas(); // Aplica o filtro sempre que um dos campos mudar
  };

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("pt-PT", options);
  };

  // Função para lidar com a mudança da data de início
  const handleDataInicioChange = (e) => setdataInicio(e.target.value);

  // Função para lidar com a mudança da data de término
  const handleDataTerminoChange = (e) => setdataTermino(e.target.value);

  const handleClear = () => {
    setEntidade("");
    setTipo("");
    setNif("");
    setdataInicio("");
    setdataTermino("");
    setFilteredFaturas(faturas); // Restaura as faturas originais
  };

  const handleSearch = () => {
    let filtered = [...faturas]; // Cria uma cópia das faturas

    // Filtra por entidade, se o valor estiver definido
    if (entidade) {
      filtered = filtered.filter((fatura) => fatura.entidade === entidade);
    }

    // Filtra por tipo, se o valor estiver definido
    if (tipo) {
      filtered = filtered.filter((fatura) => fatura.tipo === tipo);
    }

    // Filtra por NIF, se o valor estiver definido
    if (nif) {
      filtered = filtered.filter((fatura) => fatura.nif.includes(nif));
    }

    // Filtra por intervalo de datas, se as datas estiverem definidas
    if (dataInicio && dataTermino) {
      filtered = filtered.filter((fatura) => {
        const faturaData = new Date(fatura.data); // Ajuste para garantir que a data da fatura está em um formato válido
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

    // Atualiza o estado com as faturas filtradas
    setFilteredFaturas(filtered);
  };

  // Filtra as entidades com base no termo de busca
  const filteredEntidades = entidadesDisponiveis.filter((ent) =>
    ent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="header">
        <Header />
      </div>
      
        <div
          className={`formSearchContainer ${isMinimized ? "minimized" : ""}`}
        >
          <form className="formSearch" onSubmit={(e) => e.preventDefault()}>
            <div className="field-group">
              <label>Entidade:</label>
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

            {/* Campo de pesquisa por NIF */}
            <div className="field-group">
              <label>NIF:</label>
              <input
                type="text"
                name="nif"
                value={nif}
                onChange={handleNIFChange}
                placeholder="Digite o NIF"
              />
            </div>

            {/* Campo de pesquisa por Classificação */}
            <div className="field-group">
              <label>Classificação:</label>
              <input
                type="text"
                name="nif"
                value={nif}
                onChange={handleNIFChange}
                placeholder="Digite a classificação"
              />
            </div>

            {/* Campo de pesquisa por Tipo de Documento */}
            <div className="field-group">
              <label>Tipo de Documento:</label>
              <select name="tipo" value={tipo} onChange={handleTipoChange}>
                <option value="">Selecione um tipo de documento</option>
                {uniqueTipo.map((tipo, index) => (
                  <option key={index} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por intervalo de datas */}
            <div className="field-group">
              <label>Data de Início:</label>
              <input
                type="date"
                name="dataInicio"
                value={dataInicio}
                onChange={handleDataInicioChange}
              />
            </div>

            <div className="field-group">
              <label>Data de Término:</label>
              <input
                type="date"
                name="dataTermino"
                value={dataTermino}
                onChange={handleDataTerminoChange}
              />
            </div>

            <button
              className="searchButtons"
              type="submit"
              onClick={handleSearch}
            >
              Pesquisar
            </button>
            <button
              className="searchButtons"
              type="submit"
              onClick={handleClear}
            >
              Limpar Filtros
            </button>
          </form>
        </div>
        <div className="fatura-container">
          <div
            className="fatura-layout"
            style={{ height: isMinimized ? "100%" : "85%" }}
          >
            <div className="fatura-sidebar">
              <h3>Documentos</h3>
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <div className="fatura-list">
                  {filteredFaturas.map((fatura) => (
                    <div
                      key={fatura.id}
                      className="fatura-item"
                      onClick={() => selectFatura(fatura)}
                    >
                      <div className="fatura-info">
                        <div className="fatura-header">
                          <h4 className="fatura-numero">{fatura.entidade}</h4>
                          <span className="fatura-data">
                            {formatDate(fatura.data)}
                          </span>
                        </div>
                        <div className="fatura-details">
                          <span className="fatura-entidade">
                            {fatura.description}
                          </span>
                          <span className="fatura-valor">
                            €{parseFloat(fatura.total_fatura).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFatura(fatura.id);
                        }}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="fatura-pdf-viewer"
              style={{ height: isMinimized ? "100vh" : "74vh" }}
            >
              {selectedFatura ? (
                fileUrl && fileUrl.endsWith(".pdf") ? (
                  <Worker
                    workerUrl={`/node_modules/pdfjs-dist/build/pdf.worker.min.js`}
                  >
                    <Viewer
                      fileUrl={fileUrl}
                      style={{
                        width: "100%",
                        maxHeight: "100%",
                        overflow: "auto",
                      }}
                    />
                  </Worker>
                ) : (
                  <p>Selecione um documento válido.</p>
                )
              ) : (
                <p>Selecione uma fatura para ver o PDF.</p>
              )}
            </div>

            {/* Detalhes e edição no lado direito */}
            <div className="fatura-details-container">
              {selectedFatura ? (
                <div>
                  <div className="field-group">
                    <div>
                      <label>NIF</label>
                      <input
                        type="text"
                        value={selectedFatura.nif || ""} // Valor exibido no input
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Copia os outros campos
                            nif: e.target.value, // Atualiza apenas o campo "nif"
                          })
                        } // Atualiza o estado no evento de alteração
                      />
                    </div>
                    <div>
                      <label>Entidade</label>
                      <input
                        type="text"
                        value={selectedFatura.entidade || ""} // Mostra o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            entidade: e.target.value, // Atualiza apenas o campo "total_iva"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div>
                      <label>País</label>
                      <input
                        type="text"
                        value={selectedFatura.pais || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            pais: e.target.value, // Atualiza apenas o campo "pais"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>

                    <div>
                      <label>Data</label>
                      <input
                        type="date"
                        value={selectedFatura.data || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            data: e.target.value, // Atualiza o campo "data"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <div>
                      <label>IVA 6%</label>
                      <input
                        type="number"
                        value={selectedFatura.iva_6 || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            iva_6: e.target.value, // Atualiza o campo "iva_6"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>

                    <div>
                      <label>IVA 23%</label>
                      <input
                        type="number"
                        value={selectedFatura.iva_23 || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            iva_23: e.target.value, // Atualiza o campo "iva_23"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <div>
                      <label>Total IVA</label>
                      <input
                        type="number"
                        value={selectedFatura.total_iva || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            total_iva: e.target.value, // Atualiza o campo "total_iva"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>

                    <div>
                      <label>Total s/IVA</label>
                      <input
                        type="number"
                        value={
                          selectedFatura.total_fatura -
                            selectedFatura.total_iva || 0
                        } // Calcula a diferença sem arredondar
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            total_fatura:
                              parseFloat(e.target.value) +
                              (selectedFatura.total_iva || 0), // Atualiza "total_fatura" com base no valor de "Total s/IVA"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div>
                      <label>Valor Final</label>
                      <input
                        type="number"
                        value={selectedFatura.total_fatura || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            total_fatura: e.target.value, // Atualiza o campo "total_fatura"
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>

                    <div>
                      <label>Número da Fatura</label>
                      <input
                        type="text"
                        value={selectedFatura.numero_fatura || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            numero_fatura: e.target.value, // Atualiza o campo "description" (Número da Fatura)
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <div>
                      <label>Classificação</label>
                      <select
                        value={selectedFatura.classificacao || ""}
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura,
                            classificacao: e.target.value,
                          })
                        }
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
                        <option value="72.3 - Desenvolvimento de Software">
                          72.3 - Desenvolvimento de Software
                        </option>
                        <option value="72.4 - Serviços de Marketing">
                          72.4 - Serviços de Marketing
                        </option>
                        <option value="72.5 - Tradução e Interpretação">
                          72.5 - Tradução e Interpretação
                        </option>
                        <option value="73 - Venda de Mercadorias">
                          73 - Venda de Mercadorias
                        </option>
                        <option value="73.1 - Venda de Produtos">
                          73.1 - Venda de Produtos
                        </option>
                        <option value="73.2 - Vendas em Loja">
                          73.2 - Vendas em Loja
                        </option>
                        <option value="74 - Outros Serviços">
                          74 - Outros Serviços
                        </option>
                        <option value="74.1 - Treinamentos">
                          74.1 - Treinamentos
                        </option>
                        <option value="74.2 - Serviços de Eventos">
                          74.2 - Serviços de Eventos
                        </option>
                        <option value="74.3 - Serviços de Transporte">
                          74.3 - Serviços de Transporte
                        </option>
                        <option value="75 - Despesas Operacionais">
                          75 - Despesas Operacionais
                        </option>
                        <option value="75.1 - Aluguel">75.1 - Aluguel</option>
                        <option value="75.2 - Energia Elétrica">
                          75.2 - Energia Elétrica
                        </option>
                        <option value="75.3 - Água e Esgoto">
                          75.3 - Água e Esgoto
                        </option>
                        <option value="76 - Fornecimentos e Serviços Externos">
                          76 - Fornecimentos e Serviços Externos
                        </option>
                        <option value="76.1 - Trabalhos Especializados">
                          76.1 - Trabalhos Especializados
                        </option>
                        <option value="76.2 - Honorários">
                          76.2 - Honorários
                        </option>
                        <option value="76.3 - Comissões">
                          76.3 - Comissões
                        </option>
                        <option value="76.4 - Rendas e Aluguéis">
                          76.4 - Rendas e Aluguéis
                        </option>
                        <option value="76.5 - Comunicação">
                          76.5 - Comunicação
                        </option>
                        <option value="76.6 - Seguros">76.6 - Seguros</option>
                        <option value="76.7 - Royalties">
                          76.7 - Royalties
                        </option>
                        <option value="77 - Impostos e IVA">
                          77 - Impostos e IVA
                        </option>
                        <option value="77.1 - IVA Suportado">
                          77.1 - IVA Suportado
                        </option>
                        <option value="77.2 - IVA Dedutível">
                          77.2 - IVA Dedutível
                        </option>
                        <option value="77.3 - IVA Liquidado">
                          77.3 - IVA Liquidado
                        </option>
                        <option value="78 - Gastos com o Pessoal">
                          78 - Gastos com o Pessoal
                        </option>
                        <option value="78.1 - Remunerações">
                          78.1 - Remunerações
                        </option>
                        <option value="78.2 - Benefícios Pós-Emprego">
                          78.2 - Benefícios Pós-Emprego
                        </option>
                        <option value="78.3 - Indemnizações">
                          78.3 - Indemnizações
                        </option>
                        <option value="79 - Juros e Encargos Financeiros">
                          79 - Juros e Encargos Financeiros
                        </option>
                        <option value="79.1 - Juros Suportados">
                          79.1 - Juros Suportados
                        </option>
                        <option value="79.2 - Diferenças de Câmbio">
                          79.2 - Diferenças de Câmbio
                        </option>
                      </select>
                    </div>

                    <div>
                      <label>Tipo</label>
                      <select
                        value={selectedFatura.tipo || ""} // Mostra o tipo associado, ou "" caso não exista
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura,
                            tipo: e.target.value, // Atualiza o tipo selecionado
                          })
                        }
                      >
                        {/* As opções disponíveis */}
                        <option value="Fatura">Fatura</option>
                        <option value="Fatura Simplificada">
                          Fatura Simplificada
                        </option>
                        <option value="Comprovante de Venda">
                          Comprovante de Venda
                        </option>
                        <option value="Nota de Débito">Nota de Débito</option>
                        <option value="Nota de Crédito">Nota de Crédito</option>
                        <option value="Fatura Proforma">Fatura Proforma</option>
                        <option value="Recibo">Recibo</option>
                        <option value="Nota Fiscal Eletrônica">
                          Nota Fiscal Eletrônica
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="field-group">
                    <div>
                      <label>Descrição</label>
                      <input
                        type="text"
                        value={selectedFatura.description || ""} // Exibe o valor atual ou vazio
                        onChange={(e) =>
                          setSelectedFatura({
                            ...selectedFatura, // Mantém os outros campos
                            tipo: e.target.value, // Atualiza o campo "description" (Descrição)
                          })
                        } // Atualiza o estado ao digitar
                      />
                    </div>
                  </div>
                  <h2 className="notas-title">Notas</h2>
                  <div className="notes-container">
                    {notes
                      .filter((note) => {
                        return note.fatura_id === selectedFatura.id; // Filter based on matching ids
                      })
                      .map((note) => (
                        <Note key={note.id} note={note} onDelete={deleteNote} />
                      ))}
                  </div>
                  {/* Popup */}
                  <NotePopup
                    isOpen={isPopupOpen}
                    closePopup={() => setPopupOpen(false)}
                    createNote={createNote}
                  />
                  <div className="buttoncontainer">
                    <button
                      className="button-33"
                      onClick={() => setPopupOpen(true)}
                    >
                      Adicionar Nota
                    </button>
                    <button type="submit" className="button-33">
                      Guardar Alterações
                    </button>
                  </div>
                </div>
              ) : (
                <p>Selecione uma fatura para editar os detalhes.</p>
              )}
            </div>
          </div>
        </div>
      
    </>
  );
}

export default Fatura;
