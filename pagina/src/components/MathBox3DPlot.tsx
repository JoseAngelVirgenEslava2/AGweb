import React, { useEffect, useRef, useState } from 'react';
type MathBoxInstance = any;

const MathBoxViewer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mathboxInstanceRef = useRef<MathBoxInstance | null>(null);

    const [meshData, setMeshData] = useState<MeshData | null>(null);

    // 1. Hook para la obtención de datos
    useEffect(() => {
        const fetchMeshPoints = async () => {
            try {
                const response = await fetch('http://localhost:8000/get-mesh-points');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}.`);
                }
                const data: MeshData = await response.json();
                setMeshData(data);
                //console.log("Datos de malla obtenidos:", data);
            } catch (error: any) { // Tipado para el error
                console.error('Error al cargar datos del servidor:', error);
            }
        };

        fetchMeshPoints();
    }, []); // Se ejecuta solo una vez

    // 2. Hook para la inicialización y actualización de MathBox
    useEffect(() => {
        if (!containerRef.current || !meshData) {
            return;
        }

        // Limpiar instancia previa de MathBox si existe y si tiene un método 'destroy'
        if (mathboxInstanceRef.current && typeof mathboxInstanceRef.current.destroy === 'function') {
            mathboxInstanceRef.current.destroy();
            // Limpiar el DOM
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        }

        try {
            if (typeof MathBox === 'undefined' || typeof THREE === 'undefined') {
                console.error('MathBox o THREE no están disponibles globalmente. Revisa tus scripts CDN.');
                return;
            }

            let flatOriginal: number[] = [];
            let flatOrganism: number[] = [];
            let currentNumRows: number = 0;
            let currentNumCols: number = 0;

            let currentFinalMinX: number = -10, currentFinalMaxX: number = 10;
            let currentFinalMinY: number = -10, currentFinalMaxY: number = 10;
            let currentFinalMinZ: number = -10, currentFinalMaxZ: number = 10;
            let currentFinalZScale: number = 1;
            let currentCenterX: number = 0, currentCenterY: number = 0, currentCenterZ: number = 0;
            let currentCameraDistance: number = 20;

            const originalMeshRaw = meshData.original;
            const organismMeshRaw = meshData.organism;

            if (originalMeshRaw && originalMeshRaw.x && originalMeshRaw.x.length > 0 &&
                originalMeshRaw.y && originalMeshRaw.y.length > 0 &&
                originalMeshRaw.z && originalMeshRaw.z.length > 0) {

                const originalMesh: number[][][] = originalMeshRaw.z.map((row: number[], i: number) =>
                    row.map((z: number, j: number) => [originalMeshRaw.x[j], originalMeshRaw.y[i], z])
                );
                const organismMesh: number[][][] = organismMeshRaw.z.map((row: number[], i: number) =>
                    row.map((z: number, j: number) => [organismMeshRaw.x[j], organismMeshRaw.y[i], z])
                );

                flatOriginal = originalMesh.flat(2) as number[];
                flatOrganism = organismMesh.flat(2) as number[];

                currentNumRows = originalMesh.length;
                currentNumCols = originalMesh[0]?.length || 0;

                const allPoints = [...flatOriginal, ...flatOrganism];

                const xValues = allPoints.filter((_, i) => i % 3 === 0);
                const yValues = allPoints.filter((_, i) => i % 3 === 1);
                const zValues = allPoints.filter((_, i) => i % 3 === 2);

                const minX = xValues.length > 0 ? Math.min(...xValues) : -10;
                const maxX = xValues.length > 0 ? Math.max(...xValues) : 10;
                const minY = yValues.length > 0 ? Math.min(...yValues) : -10;
                const maxY = yValues.length > 0 ? Math.max(...yValues) : 10;
                const minZ = zValues.length > 0 ? Math.min(...zValues) : -10;
                const maxZ = zValues.length > 0 ? Math.max(...zValues) : 10;

                const xRangeBuffer = (maxX - minX) * 0.1;
                const yRangeBuffer = (maxY - minY) * 0.1;
                const zRangeBuffer = (maxZ - minZ) * 0.1;

                currentFinalMinX = minX - xRangeBuffer;
                currentFinalMaxX = maxX + xRangeBuffer;
                currentFinalMinY = minY - yRangeBuffer;
                currentFinalMaxY = maxY + yRangeBuffer;
                currentFinalMinZ = minZ - zRangeBuffer;
                currentFinalMaxZ = maxZ + zRangeBuffer;

                if (currentFinalMinX === currentFinalMaxX) { currentFinalMinX -= 1; currentFinalMaxX += 1; }
                if (currentFinalMinY === currentFinalMaxY) { currentFinalMinY -= 1; currentFinalMaxY += 1; }
                if (currentFinalMinZ === currentFinalMaxZ) { currentFinalMinZ -= 1; currentFinalMaxZ += 1; }

                const xExtent = currentFinalMaxX - currentFinalMinX;
                const yExtent = currentFinalMaxY - currentFinalMinY;
                const zExtent = currentFinalMaxZ - currentFinalMinZ;

                const maxXYExtent = Math.max(xExtent, yExtent);
                currentFinalZScale = zExtent > 0 ? Math.min(1, maxXYExtent / zExtent) : 1;
                currentFinalZScale = Math.max(currentFinalZScale, 0.01);

                currentCenterX = (currentFinalMinX + currentFinalMaxX) / 2;
                currentCenterY = (currentFinalMinY + currentFinalMaxY) / 2;
                currentCenterZ = (currentFinalMinZ + currentFinalZScale) / 2;

                currentCameraDistance = Math.max(xExtent, yExtent, (zExtent / currentFinalZScale) * 0.5) * 1.5;
                currentCameraDistance = Math.max(currentCameraDistance, 20);

            } else {
                console.warn('Datos de malla no válidos o vacíos del servidor. Usando datos de prueba.');
                currentFinalMinX = -10; currentFinalMaxX = 10;
                currentFinalMinY = -10; currentFinalMaxY = 10;
                currentFinalMinZ = -5; currentFinalMaxZ = 5;
                currentFinalZScale = 1;
                currentCenterX = 0; currentCenterY = 0; currentCenterZ = 0;
                currentCameraDistance = 30;
            }

            // --- Inicialización de MathBox ---
            const mathbox: MathBoxInstance = MathBox.mathBox({
                plugins: ['core', 'controls', 'cursor'],
                controls: { klass: THREE.OrbitControls },
                element: containerRef.current,
            });

            if (!mathbox) {
                console.error('ERROR: MathBox no se pudo inicializar.');
                if (containerRef.current) {
                    containerRef.current.innerHTML = '<div style="color: red; text-align: center;">ERROR: MathBox no se pudo inicializar.</div>';
                }
                return;
            }
            mathboxInstanceRef.current = mathbox;

            mathbox.camera({
                proxy: true,
                position: [2, 3, 2],
                rotation: [-0.5, 0.5, 0],
            });
            
            const view = mathbox.cartesian({
                range: [[currentFinalMinX, currentFinalMaxX], [currentFinalMinY, currentFinalMaxY], [currentFinalMinZ, currentFinalMaxZ]],
                scale: [1, 1, currentFinalZScale],
            });

            view.axis({ axis: 1, width: 3, color: 0xcccccc });
            view.axis({ axis: 2, width: 3, color: 0xcccccc });
            view.axis({ axis: 3, width: 3, color: 0xcccccc });

            view.grid({
                axes: [1, 2],
                divideX: 10,
                divideY: 10,
                width: 1,
                color: 0x888888,
                opacity: 0.2,
            });

            const testNumRows: number = 50;
            const testNumCols: number = 50;
            const testFlatData: number[] = [];
            for (let i: number = 0; i < testNumRows; i++) {
                for (let j: number = 0; j < testNumCols; j++) {
                    const x: number = (i / (testNumRows - 1)) * (currentFinalMaxX - currentFinalMinX) + currentFinalMinX;
                    const y: number = (j / (testNumCols - 1)) * (currentFinalMaxY - currentFinalMinY) + currentFinalMinY;
                    const z: number = Math.sin(x) + Math.cos(y);
                    testFlatData.push(x, y, z);
                }
            }

            view.array({
                channels: 3,
                items: testNumRows,
                live: false,
                width: testNumCols,
                data: testFlatData,
            }).surface({
                color: 0x00ff00,
                shaded: true,
                lineX: true,
                lineY: true,
                opacity: 0.6,
            });

            if (flatOriginal.length > 0 && flatOrganism.length > 0) {
                view.array({
                    channels: 3,
                    items: currentNumRows,
                    live: false,
                    width: currentNumCols,
                    data: flatOriginal,
                }).surface({
                    color: 0xff0000,
                    shaded: true,
                    lineX: true,
                    lineY: true,
                    opacity: 0.5,
                });

                view.array({
                    channels: 3,
                    items: currentNumRows,
                    live: false,
                    width: currentNumCols,
                    data: flatOrganism,
                }).surface({
                    color: 0x0000ff,
                    shaded: true,
                    lineX: true,
                    lineY: true,
                    opacity: 0.5,
                });
            } else {
                console.warn("No se renderizaron las mallas original/organismo porque los datos están vacíos.");
            }

        } catch (error: any) {
            console.error('Error durante la inicialización o configuración de MathBox:', error);
            if (containerRef.current) {
                containerRef.current.innerHTML = '<div style="color: red; text-align: center;">Error al renderizar el gráfico: ' + error.message + '</div>';
            }
        }

        // Función de limpieza para cuando el componente se desmonte
        return () => {
            if (mathboxInstanceRef.current && typeof mathboxInstanceRef.current.destroy === 'function') {
                mathboxInstanceRef.current.destroy();
                mathboxInstanceRef.current = null;
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [meshData]);

    return (
        <div id="plot-container" ref={containerRef} style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
            {!meshData && <div className="loading-message">Cargando datos y renderizando el gráfico...</div>}
        </div>
    );
};

export default MathBoxViewer;