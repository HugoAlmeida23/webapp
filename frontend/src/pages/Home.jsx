import { useState, useEffect } from "react";
import api from "../api";
import Header from "../components/Header";
import "../styles/Home.css";
import "../styles/Dashboard.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

function Home() {
  const [faturas, setFaturas] = useState([]);
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalIva, setTotalIva] = useState(0);
  const [totalSemIva, setTotalSemIva] = useState(0);
  const [entidadesDisponiveis, setEntidadesDisponiveis] = useState([]);
  const [entidadeSelecionada, setEntidadeSelecionada] = useState("");
  const [anos, setAnos] = useState([]);
  const [graficoData, setGraficoData] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(""); // Estado para ano selecionado
  const [loading, setLoading] = useState(true); // Initialize loading state

  useEffect(() => {
    const ano = ["2022", "2023", "2024","2025"];
    setAnos(ano);
    getFaturas();
    fetchEntidades();
  }, []);

  // Função para filtrar por ano
  const filterByAno = (selectedAno) => {
    setAnoSelecionado(selectedAno);

    // Filtra as faturas pelo ano selecionado
    const filteredFaturas = selectedAno
      ? faturas.filter((fatura) => {
          const data = new Date(fatura.data);
          return data.getFullYear().toString() === selectedAno; // Compara o ano
        })
      : faturas;

    calculateTotals(filteredFaturas);
    processGraficoData(filteredFaturas);
  };

  const getFaturas = () => {
    setLoading(true); // Set loading to true before fetching
    api
      .get("/api/faturas/")
      .then((res) => res.data)
      .then((data) => {
        setFaturas(data);
        calculateTotals(data);
        processGraficoData(data);
        setLoading(false);
      })
      .catch((err) => alert(err));
  };

  const fetchEntidades = () => {
    api
      .get("/api/faturas/entidades/")
      .then((res) => setEntidadesDisponiveis(res.data))
      .catch((err) => alert("Erro ao carregar entidades: " + err));
  };

  const calculateTotals = (data) => {
    const totalFaturas = data.reduce(
      (sum, fatura) => sum + parseFloat(fatura.total_fatura),
      0
    );
    const totalIVA = data.reduce(
      (sum, fatura) => sum + parseFloat(fatura.total_iva),
      0
    );
    const totalSemIVA = totalFaturas - totalIVA;

    setTotalGasto(totalFaturas.toFixed(2));
    setTotalIva(totalIVA.toFixed(2));
    setTotalSemIva(totalSemIVA.toFixed(2));
  };
  
  const processGraficoData = (data) => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const groupedData = data.reduce((acc, fatura) => {
      const date = new Date(fatura.data);
      const month = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += parseFloat(fatura.total_fatura);
      return acc;
    }, {});

    const currentYear = new Date().getFullYear();
    const formattedData = months.map((month, index) => {
      const key = `${month} ${2024}`;
      return { name: key, total: groupedData[key] || 0 };
    });

    setGraficoData(formattedData);
  };

  const filterByEntidade = (selectedEntidade) => {
    setEntidadeSelecionada(selectedEntidade);

    const filteredFaturas = selectedEntidade
      ? faturas.filter((fatura) => fatura.entidade === selectedEntidade)
      : faturas;

    calculateTotals(filteredFaturas);
    processGraficoData(filteredFaturas);
  };

  return (
    <div>
      <Header />
      <div className="dashboard-container">
        <h1>Dashboard</h1>

        <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Número de Faturas</h3>
          <p>{loading ? <i className="fas fa-spinner fa-spin"></i> : faturas.length}</p> {/* Display spinner if loading */}
        </div>
          <div className="stat-card">
            <h3>Total Gasto</h3>
            <p>{loading ? <i className="fas fa-spinner fa-spin"></i> : totalGasto + "€"} </p>
          </div>
          <div className="stat-card">
            <h3>Total IVA</h3>
            <p>{loading ? <i className="fas fa-spinner fa-spin"></i> : totalIva + "€"}</p>
          </div>
          <div className="stat-card">
            <h3>Total sem IVA</h3>
            <p>{loading ? <i className="fas fa-spinner fa-spin"></i> : totalSemIva + "€"}</p>
          </div>
        </div>

        <div className="filters">
          <label>Entidade:</label>
          <select
            value={entidadeSelecionada}
            onChange={(e) => filterByEntidade(e.target.value)}
          >
            <option value="">Todas</option>
            {entidadesDisponiveis.map((entidade, index) => (
              <option key={index} value={entidade}>
                {entidade}
              </option>
            ))}
          </select>
          <label className="anoLabel">Ano:</label>
          <select
            value={anoSelecionado}
            onChange={(e) => filterByAno(e.target.value)} // Corrigi para chamar filterByAno
          >
            <option value="">Todos</option>
            {anos.map((ano, index) => (
              <option key={index} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={graficoData}
            margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#062e58" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#062e58" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#062e58"
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Home;
