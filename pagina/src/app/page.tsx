"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Plot from "@/components/Plotly";

interface Organismo {
  a: number;
  b: number;
  c: number;
  bin: string;
  adaptabilidad: number;
}

interface OriginalPoints {
  x: number[];
  y: number[];
  z: number[];
}

const Principal: React.FC = () => {
  const [form, setForm] = useState({
    rangoa: "",
    rangob: "",
    rangoc: "",
    rangod: "",
    rangoe: "",
    rangof: "",
    criterio: "",
    generaciones: "",
    tipo_algoritmo: "",
    tipo_funcion: "",
    error: "",
  });
  const [errorPromedio, setErrorPromedio] = useState<
    { generacion: number; error: number }[]
  >([]);
  const [evolucion, setEvolucion] = useState<
    { generacion: number; error: number }[]
  >([]);
  const [resultado, setResultado] = useState<Organismo[]>([]);
  const [originalPoints, setOriginalPoints] = useState<OriginalPoints | null>(
    null
  );
  const [bestOrganismPoints, setBestOrganismPoints] = useState<{
    x: number[];
    y: number[];
    z: number[];
  } | null>(null);

  const criterios = [
    { value: "error_absoluto", label: "Error absoluto (adaptabilidad ≥ 99%)" },
    { value: "mejora_progresiva", label: "Mejora progresiva (mejora < 1%)" },
    { value: "numero_generaciones", label: "Por numero de generaciones" },
  ];

  const algoritmos = [
    { value: "ruleta", label: "Algoritmo de ruleta" },
    { value: "ranking", label: "Algoritmo de ranking" },
    { value: "torneo", label: "Algoritmo de torneo" },
    { value: "aleatorio", label: "Algoritmo de seleccion aleatoria" },
  ];
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await fetch("http://localhost:8000/add-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rangoa: form.rangoa,
          rangob: form.rangob,
          rangoc: form.rangoc,
          rangod: form.rangod,
          rangoe: form.rangoe,
          rangof: form.rangof,
          criterio: form.criterio || "error_absoluto",
          generaciones: form.generaciones ? parseInt(form.generaciones) : null,
          tipo_algoritmo: form.tipo_algoritmo || "ruleta",
          error: form.error ? parseFloat(form.error) : null,
          tipo_funcion: form.tipo_funcion || "general",
        }),
      });

      await fetch("http://localhost:8000/generate-organisms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const resBest = await fetch("http://localhost:8000/get-best");
      const bestData: Organismo[] = await resBest.json();
      setResultado(bestData);

      const resEvo = await fetch("http://localhost:8000/get-evolution");
      const evoDatos: Organismo[] = await resEvo.json();

      const resOriginalPoints = await fetch(
        "http://localhost:8000/get-original-points"
      );
      const originalPointsData: OriginalPoints = await resOriginalPoints.json();
      setOriginalPoints(originalPointsData);

      const pointsX = originalPointsData.x;
      const pointsY = originalPointsData.y;
      const pointsZ_original = originalPointsData.z;

      const evolucionData = evoDatos.map((org, i) => {
        const error =
          pointsX.reduce((sum, x, j) => {
            const y = pointsY[j];
            const zOrg = org.a * x ** 2 + org.b * y ** 2 + org.c * x * y;
            return sum + Math.abs(zOrg - pointsZ_original[j]);
          }, 0) / pointsX.length;

        return {
          generacion: i,
          error: parseFloat(error.toFixed(4)),
        };
      });
      setEvolucion(evolucionData);

      if (bestData.length > 0) {
        const bestOrg = bestData[0];
        const bestOrgPointsZ = pointsX.map((x, i) => {
          const y = pointsY[i];
          return bestOrg.a * x ** 2 + bestOrg.b * y ** 2 + bestOrg.c * x * y;
        });
        setBestOrganismPoints({ x: pointsX, y: pointsY, z: bestOrgPointsZ });
      }

      const resProm = await fetch("http://localhost:8000/promedio-error");
      const promedioDatos = await resProm.json();
      setErrorPromedio(promedioDatos);
    } catch (err) {
      console.error("Error al enviar datos", err);
    }
  };

  const top10 = resultado
    .sort((a, b) => b.adaptabilidad - a.adaptabilidad)
    .slice(0, 10);

  const ThreeDPlot = ({
    originalData,
    organismData,
  }: {
    originalData: OriginalPoints | null;
    organismData: { x: number[]; y: number[]; z: number[] } | null;
  }) => {
    if (!originalData || !organismData) return <p>Cargando datos 3D...</p>;

    const data: Plotly.Data[] = [
      {
        x: originalData.x,
        y: originalData.y,
        z: originalData.z,
        mode: "markers",
        type: "scatter3d",
        marker: {
          color: "red",
          size: 3,
        },
        name: "Función Original",
      },
      {
        x: organismData.x,
        y: organismData.y,
        z: organismData.z,
        mode: "markers",
        type: "scatter3d",
        marker: {
          color: "blue",
          size: 3,
        },
        name: "Mejor Organismo Encontrado",
      },
    ];

    return (
      <Plot
        data={data}
        layout={{
          autosize: true,
          margin: { l: 0, r: 0, b: 0, t: 0 },
          scene: {
            xaxis: { title: { text: "X" } },
            yaxis: { title: { text: "Y" } },
            zaxis: { title: { text: "Z" } },
          },
          title: {
            text: "Función Original vs. Mejor Organismo (3D)",
          },
        }}
        style={{ width: "100%", height: "500px" }}
        useResizeHandler={true}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <Card>
        <CardContent className="grid grid-cols-3 gap-4">
          <input
            type="text"
            name="rangoa"
            placeholder="[-10,10]"
            value={form.rangoa}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="rangob"
            placeholder="[-10,10]"
            value={form.rangob}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="rangoc"
            placeholder="[-10,10]"
            value={form.rangoc}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="rangod"
            placeholder="[-10,10]"
            value={form.rangod}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="rangoe"
            placeholder="[-10,10]"
            value={form.rangoe}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="rangof"
            placeholder="[-10,10]"
            value={form.rangof}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="error"
            placeholder="0.01"
            value={form.error}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <select
            name="criterio"
            value={form.criterio}
            onChange={handleChange}
            className="col-span-3 border p-2 rounded"
          >
            {criterios.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          <select
            name="tipo_algoritmo"
            value={form.tipo_algoritmo}
            onChange={handleChange}
            className="col-span-3 border p-2 rounded"
          >
            {algoritmos.map((al) => (
              <option key={al.value} value={al.value}>
                {al.label}
              </option>
            ))}
          </select>

          {form.criterio === "numero_generaciones" && (
            <input
              type="number"
              name="generaciones"
              placeholder="Número de generaciones"
              value={form.generaciones}
              onChange={handleChange}
              className="col-span-3 border p-2 rounded"
            />
          )}

          <select
            name="tipo_funcion"
            value={form.tipo_funcion}
            onChange={handleChange}
            className="col-span-3 border p-2 rounded"
          >
            <option value="general">
              General (ax² + by² + cxy + dx + ey + f)
            </option>
            <option value="paraboloide">Paraboloide (ax² + by² + f)</option>
            <option value="elipsoide">Elipsoide (ax² + by² + cxy + f)</option>
          </select>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Calcular y Mostrar Organismos
        </Button>
      </div>

      {top10.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">
            Mejores Organismos (≥85% adaptabilidad)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {top10.map((org, index) => (
              <Card key={index}>
                <CardContent>
                  <p>
                    <strong>a:</strong> {org.a}
                  </p>
                  <p>
                    <strong>b:</strong> {org.b}
                  </p>
                  <p>
                    <strong>c:</strong> {org.c}
                  </p>
                  <p>
                    <strong>Adaptabilidad:</strong> {org.adaptabilidad}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {evolucion.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">
            Evolución del Error del Mejor Organismo
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="generacion"
                label={{
                  value: "Generación",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{ value: "Error", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="error"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {errorPromedio.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">
            Evolución del Error Promedio por Generación
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorPromedio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="generacion"
                label={{
                  value: "Generación",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{
                  value: "Error Promedio",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="error"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {originalPoints && bestOrganismPoints && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">
            Gráfica 3D del Mejor Organismo
          </h2>
          <ThreeDPlot
            originalData={originalPoints}
            organismData={bestOrganismPoints}
          />
        </div>
      )}
    </div>
  );
};

export default Principal;
