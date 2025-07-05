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

interface Organismo {
  a: number;
  b: number;
  c: number;
  bin: string;
  adaptabilidad: number;
}

const Principal: React.FC = () => {
  const [form, setForm] = useState({
    a: "",
    b: "",
    c: "",
    rangoa: "",
    rangob: "",
    rangoc: "",
  });
  const [errorPromedio, setErrorPromedio] = useState<
    { generacion: number; error: number }[]
  >([]);
  const [evolucion, setEvolucion] = useState<
    { generacion: number; error: number }[]
  >([]);
  const [resultado, setResultado] = useState<Organismo[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await fetch("http://localhost:8000/add-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a: form.a,
          b: form.b,
          c: form.c,
          rangoa: form.rangoa,
          rangob: form.rangob,
          rangoc: form.rangoc,
        }),
      });

      await fetch("http://localhost:8000/generate-organisms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const res = await fetch("http://localhost:8000/get-best");
      const datos = await res.json();
      setResultado(datos);

      const resEvo = await fetch("http://localhost:8000/get-evolution");
      const evoDatos = await resEvo.json();

      const puntos = Array.from({ length: 20 }, (_, i) => -10 + i * (20 / 19)); // 20 puntos entre [-10, 10]
      const fa = parseFloat(form.a);
      const fb = parseFloat(form.b);
      const fc = parseFloat(form.c);

      const fy = puntos.map((x) => fa * x ** 2 + fb * x + fc);

      const evolucionData = evoDatos.map((org: Organismo, i: number) => {
        const error =
          puntos.reduce((sum, x, j) => {
            const yOrg = org.a * x ** 2 + org.b * x + org.c;
            return sum + Math.abs(yOrg - fy[j]);
          }, 0) / puntos.length;

        return {
          generacion: i,
          error: parseFloat(error.toFixed(4)),
        };
      });

      setEvolucion(evolucionData);

      const resProm = await fetch(
        "http://localhost:8000/promedio-error"
      );
      const promedioDatos = await resProm.json();
      setErrorPromedio(promedioDatos);
    } catch (err) {
      console.error("Error al enviar datos", err);
    }
  };

  const top10 = resultado
    .sort((a, b) => b.adaptabilidad - a.adaptabilidad)
    .slice(0, 10);
  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <Card>
        <CardContent className="grid grid-cols-3 gap-4">
          <input
            type="text"
            name="a"
            placeholder="a"
            value={form.a}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="b"
            placeholder="b"
            value={form.b}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="c"
            placeholder="c"
            value={form.c}
            onChange={handleChange}
            className="border p-2 rounded"
          />
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
                    <strong>Binario:</strong> {org.bin}
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
    </div>
  );
};

export default Principal;
