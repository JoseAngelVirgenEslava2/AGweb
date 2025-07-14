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
import dynamic from "next/dynamic";

const MathBox3DPlot = dynamic(() => import("@/components/MathBox3DPlot"), {
  ssr: false,
});

interface Organismo {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  adaptabilidad: number;
}

interface FormState {
  rangoa: string;
  rangob: string;
  rangoc: string;
  rangod: string;
  rangoe: string;
  rangof: string;
  criterio: string;
  generaciones: string;
  tipo_algoritmo: string;
  error: string;
}

interface Mesh {
  x: number[];
  y: number[];
  z: number[][];
}

const Principal: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    rangoa: "",
    rangob: "",
    rangoc: "",
    rangod: "",
    rangoe: "",
    rangof: "",
    criterio: "",
    generaciones: "",
    tipo_algoritmo: "ruleta",
    error: "",
  });

  const [resultado, setResultado] = useState<Organismo[]>([]);
  const [evolucion, setEvolucion] = useState<
    { generacion: number; error: number }[]
  >([]);
  const [errorPromedio, setErrorPromedio] = useState<
    { generacion: number; error: number }[]
  >([]);
  const [originalMesh, setOriginalMesh] = useState<number[][][] | null>(null);
  const [organismMesh, setOrganismMesh] = useState<number[][][] | null>(null);

  const criterios = [
    { value: "error_absoluto", label: "Error absoluto (adaptabilidad ≥ 99%)" },
    { value: "mejora_progresiva", label: "Mejora progresiva (mejora < 1%)" },
    { value: "numero_generaciones", label: "Por número de generaciones" },
  ];

  const algoritmos = [
    { value: "ruleta", label: "Ruleta" },
    { value: "ranking", label: "Ranking" },
    { value: "torneo", label: "Torneo" },
    { value: "aleatorio", label: "Aleatorio" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Paso 1: enviar parámetros
      const tipo_algoritmo = form.tipo_algoritmo || "ruleta";
      const criterio = form.criterio || "error_absoluto";
      await fetch("http://localhost:8000/add-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tipo_algoritmo,
          criterio,
          generaciones: form.generaciones ? parseInt(form.generaciones) : null,
          error: form.error ? parseFloat(form.error) : null,
        }),
      });

      // Paso 2: generar organismos
      await fetch("http://localhost:8000/generate-organisms", {
        method: "POST",
      });

      // Paso 3: obtener mejores organismos
      const resBest = await fetch("http://localhost:8000/get-best");
      const best = await resBest.json();
      setResultado(best);
      // Paso 4: obtener evolución
      const resEvo = await fetch("http://localhost:8000/get-evolution");
      const evo = await resEvo.json();

      // Paso 5: error promedio
      const resProm = await fetch("http://localhost:8000/promedio-error");
      const prom = await resProm.json();
      setErrorPromedio(prom);

      // Paso 6: obtener malla para visualización
      const resMesh = await fetch("http://localhost:8000/get-mesh-points");
      const meshData: { original: Mesh; organism: Mesh } = await resMesh.json();

      const originalMesh = meshData.original.z.map((row, i) =>
        row.map((z, j) => [meshData.original.x[i], meshData.original.y[j], z])
      );
      const organismMesh = meshData.organism.z.map((row, i) =>
        row.map((z, j) => [meshData.organism.x[i], meshData.organism.y[j], z])
      );

      setOriginalMesh(originalMesh);
      setOrganismMesh(organismMesh);
      //console.log("Original mesh shape:", originalMesh?.length, originalMesh?.[0]?.length);
      //console.log("Example point:", originalMesh?.[0]?.[0]);

      // Paso 7: calcular evolución del mejor organismo (error)
      const evolucionData = evo.map((org: Organismo, i: number) => {
        let sumError = 0;
        const size = meshData.original.z.length;
      
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const x = meshData.original.x[c];
            const y = meshData.original.y[r];
            const z_real = meshData.original.z[r][c];
            const z_est =
              org.a * x ** 2 +
              org.b * y ** 2 +
              org.c * x * y +
              org.d * x +
              org.e * y +
              org.f;
      
            sumError += Math.abs(z_est - z_real);
          }
        }
      
        const error = sumError / (size * size);
        return { generacion: i, error: parseFloat(error.toFixed(4)) };
      });

      setEvolucion(evolucionData);
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
    }
  };

  const top10 = resultado
  .sort((a, b) => b.adaptabilidad - a.adaptabilidad)
  .slice(0, 10);
  return (
    <div className="max-w-5xl mx-auto p-4">
      <Card>
        <CardContent className="grid grid-cols-3 gap-4">
          {(Object.keys(form) as (keyof FormState)[]).map((key) =>
            key !== "criterio" &&
            key !== "tipo_algoritmo" &&
            key !== "generaciones" ? (
              <input
                key={key}
                type={key === "error" ? "number" : "text"}
                name={key}
                placeholder={key === "error" ? "0.01" : `[-10,10]`}
                value={form[key]}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            ) : null
          )}

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
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Ejecutar algoritmo genético
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

      {originalMesh && organismMesh && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Visualización en 3D (MathBox)</h2>
          <MathBox3DPlot
            originalMesh={originalMesh}
            organismMesh={organismMesh}
          />
        </div>
      )}

      {evolucion.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Evolucion del error del mejor organismo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="generacion" />
              <YAxis />
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
            Error Promedio por Generación
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorPromedio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="generacion" />
              <YAxis />
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
    </div>
  );
};

export default Principal;
