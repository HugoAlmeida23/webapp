import { useState, useEffect } from "react";
import api from "../api";
import Header from "../components/Header";
import "../styles/Dashboard.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
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
  const [filteredFaturas, setFilteredFaturas] = useState([]);
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalIva, setTotalIva] = useState(0);
  const [totalSemIva, setTotalSemIva] = useState(0);
  const [entidadesDisponiveis, setEntidadesDisponiveis] = useState([]);
  const [entidadeSelecionada, setEntidadeSelecionada] = useState("");
  const [anos, setAnos] = useState([]);
  const [graficoData, setGraficoData] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    // Get current and past years
    const currentYear = new Date().getFullYear();
    const availableYears = [
      (currentYear - 2).toString(),
      (currentYear - 1).toString(),
      currentYear.toString(),
      (currentYear + 1).toString(),
    ];
    setAnos(availableYears);

    // Load faturas and entidades
    getFaturas();
    fetchEntidades();
  }, []);

  // Apply filters whenever filtered data changes
  useEffect(() => {
    calculateTotals(filteredFaturas);
    processGraficoData(filteredFaturas);
  }, [filteredFaturas]);

  // Apply both filters whenever one changes
  useEffect(() => {
    applyFilters();
  }, [faturas, anoSelecionado, entidadeSelecionada]);

  const getFaturas = () => {
    setLoading(true);
    api
      .get("/api/faturas/")
      .then((res) => {
        // Ensure data is properly formatted
        const formattedData = res.data.map((fatura) => ({
          ...fatura,
          total_fatura: parseFloat(fatura.total_fatura) || 0,
          total_iva: parseFloat(fatura.total_iva) || 0,
          // Ensure data is a valid Date object
          data:
            new Date(fatura.data).toString() === "Invalid Date"
              ? new Date()
              : new Date(fatura.data),
        }));

        setFaturas(formattedData);
        setFilteredFaturas(formattedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching faturas:", err);
        alert("Erro ao carregar faturas. Por favor, tente novamente.");
        setLoading(false);
      });
  };

  const fetchEntidades = () => {
    api
      .get("/api/faturas/entidades/")
      .then((res) => setEntidadesDisponiveis(res.data))
      .catch((err) => {
        console.error("Error fetching entidades:", err);
        alert("Erro ao carregar entidades. Por favor, tente novamente.");
      });
  };

  // Apply both filters at once
  const applyFilters = () => {
    let result = [...faturas];

    // Apply year filter if selected
    if (anoSelecionado) {
      result = result.filter((fatura) => {
        return fatura.data.getFullYear().toString() === anoSelecionado;
      });
    }
    // No year filter means show all years

    // Apply entity filter if selected
    if (entidadeSelecionada) {
      result = result.filter(
        (fatura) => fatura.entidade === entidadeSelecionada
      );
    }
    // No entity filter means show all entities

    setFilteredFaturas(result);
  };

  const calculateTotals = (data) => {
    if (!data || data.length === 0) {
      setTotalGasto("0.00");
      setTotalIva("0.00");
      setTotalSemIva("0.00");
      return;
    }

    const totalFaturas = data.reduce(
      (sum, fatura) => sum + (parseFloat(fatura.total_fatura) || 0),
      0
    );
    const totalIVA = data.reduce(
      (sum, fatura) => sum + (parseFloat(fatura.total_iva) || 0),
      0
    );
    const totalSemIVA = totalFaturas - totalIVA;

    setTotalGasto(totalFaturas.toFixed(2));
    setTotalIva(totalIVA.toFixed(2));
    setTotalSemIva(totalSemIVA.toFixed(2));
  };

  const processGraficoData = (data) => {
    if (!data || data.length === 0) {
      // Provide empty data for all months
      const emptyData = generateEmptyMonthsData();
      setGraficoData(emptyData);
      return;
    }

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

    // Initialize an object with all months having 0 values
    const monthlyTotals = {};
    months.forEach(month => {
      monthlyTotals[month] = 0;
    });

    // Group by month only (combining years if no year selected)
    data.forEach((fatura) => {
      if (!fatura.data) return;

      const monthIndex = fatura.data.getMonth();
      const month = months[monthIndex];
      
      // Add to the monthly total, regardless of year
      monthlyTotals[month] += parseFloat(fatura.total_fatura) || 0;
    });

    // Create data for chart with consistent ordering
    const formattedData = months.map((month, index) => {
      return {
        name: month,
        total: monthlyTotals[month],
        month: index,
      };
    });

    // Sort by month chronologically
    formattedData.sort((a, b) => a.month - b.month);

    setGraficoData(formattedData);
  };

  // Generate empty data for all months
  const generateEmptyMonthsData = () => {
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

    return months.map((month, index) => ({
      name: month,
      total: 0,
      month: index,
    }));
  };

  const filterByEntidade = (selectedEntidade) => {
    setEntidadeSelecionada(selectedEntidade);
  };

  const filterByAno = (selectedAno) => {
    setAnoSelecionado(selectedAno);
  };

  // Custom tooltip for the area chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="value">{`Total: ${Number(payload[0].value).toFixed(
            2
          )}€`}</p>
        </div>
      );
    }
    return null;
  };

  // Determine what to display in the chart title
  const getChartTitle = () => {
    if (anoSelecionado) {
      return `Gastos Mensais - ${anoSelecionado}`;
    } else {
      return "Gastos Mensais - Todos os Anos";
    }
  };

  return (
    <div className="main">
      <Header />
      <div className="dashboard-container">
        <h1>Dashboard</h1>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Número de Faturas</h3>
            <p>
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                filteredFaturas.length
              )}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Gasto</h3>
            <p>
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                `${totalGasto}€`
              )}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total IVA</h3>
            <p>
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                `${totalIva}€`
              )}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total sem IVA</h3>
            <p>
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                `${totalSemIva}€`
              )}
            </p>
          </div>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Entidade:</label>
            <select
              className="dropdownFilters"
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
          </div>

          <div className="filter-group">
            <label>Ano:</label>
            <select
              className="dropdownFilters"
              value={anoSelecionado}
              onChange={(e) => filterByAno(e.target.value)}
            >
              <option value="">Todos os Anos</option>
              {anos.map((ano, index) => (
                <option key={index} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="chart-loading">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p>Carregando dados...</p>
          </div>
        ) : (
          <div className="chart-container">
            <h2>{getChartTitle()}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={graficoData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }} // Increase bottom margin
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#062e58" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#062e58" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.1)"
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "rgba(255, 255, 255, 0.7)",
                    angle: -45,
                    textAnchor: "end",
                  }}
                  tickMargin={20}
                  height={60}
                />
                <YAxis
                  tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#062e58"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;