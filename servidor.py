import random
from fastapi import FastAPI
import ast
from modelos.Parametros import Parametros
from modelos.Clase import Elemento
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Configuraciones globales
bits = 8
two_n = 2 ** bits
mejores_por_generacion = []
pila = []
error_por_generacion = []
numero_generaciones = 0
tipo_algoritmo = None
error_aceptacion = 0.0

# Datos globales
funcion_original = {'a': 1, 'b': 1, 'c': 0, 'd': 0, 'e': 0, 'f': 0}
rangos = {'a': None, 'b': None, 'c': None, 'd': None, 'e': None, 'f': None}
mapas = {'a': None, 'b': None, 'c': None, 'd': None, 'e': None, 'f': None}
poblacion = []
puntos_x = []
puntos_y = []
puntos_z_original = []
criterio_paro = {"tipo": None}

# --------------------------
# Utilidades del algoritmo genético
# --------------------------

def mapear(rango):
    minimo, maximo = float(rango[0]), float(rango[1])
    mapa = {}
    delta = (maximo - minimo) / (two_n - 1)
    for i in range(two_n):
        valor_decimal = round(minimo + i * delta, 6)
        binario = format(i, f'0{bits}b')
        mapa[valor_decimal] = binario
    return mapa, delta

def buscar_binario(valor, mapa):
    valor = round(float(valor), 6)
    if valor in mapa:
        return mapa[valor]
    else:
        mas_cercano = min(mapa.keys(), key=lambda k: abs(k - valor))
        return mapa[mas_cercano]

def generar_valor_aleatorio(rango):
    minimo, maximo = float(rango[0]), float(rango[1])
    return round(random.uniform(minimo, maximo), 6)

def decodificar(binario, rango):
    indice = int(binario, 2)
    minimo, maximo = float(rango[0]), float(rango[1])
    delta = (maximo - minimo) / (two_n - 1)
    return round(minimo + indice * delta, 6)

def generar_malla_puntos(x_range=(-10, 10), y_range=(-10, 10), pasos=50):
    global puntos_x, puntos_y, puntos_z_original
    puntos_x.clear()
    puntos_y.clear()
    puntos_z_original.clear()

    a, b, c, d, e, f = (
        funcion_original["a"], funcion_original["b"], funcion_original["c"],
        funcion_original["d"], funcion_original["e"], funcion_original["f"]
    )

    x_vals = np.linspace(x_range[0], x_range[1], pasos)
    y_vals = np.linspace(y_range[0], y_range[1], pasos)

    for y in y_vals:
        for x in x_vals:
            z = a*x**2 + b*y**2 + c*x*y + d*x + e*y + f
            puntos_x.append(x)
            puntos_y.append(y)
            puntos_z_original.append(z)

def calcular_error(a, b, c, d, e, f):
    errores = []
    for x, y, z_real in zip(puntos_x, puntos_y, puntos_z_original):
        z_pred = a * x**2 + b * y**2 + c * x * y + d * x + e * y + f
        errores.append(abs(z_pred - z_real))

    return sum(errores) / len(errores)

def evaluar_poblacion():
    if not poblacion:
        return []
    errores = [(elem, calcular_error(elem.a, elem.b, elem.c, elem.d, elem.e, elem.f)) for elem in poblacion]
    max_error = max([e[1] for e in errores])
    for elem, err in errores:
        adaptabilidad = max(0.0, 1.0 - (err / max_error)) if max_error != 0 else 1.0
        elem.adaptabilidad = round(adaptabilidad, 4)
    return sorted(errores, key=lambda x: x[0].adaptabilidad, reverse=True)

def seleccion_ruleta(individuos=None):
    individuos = individuos or poblacion
    total = sum(e.adaptabilidad for e in individuos)
    probabilidades = [e.adaptabilidad / total for e in individuos]
    seleccionados = []
    for _ in range(len(individuos)):
        r = random.random()
        acumulado = 0
        for i, p in enumerate(probabilidades):
            acumulado += p
            if acumulado >= r:
                seleccionados.append(individuos[i])
                break
    return seleccionados

def seleccion_ranking(individuos=None):
    individuos = sorted(individuos or poblacion, key=lambda x: x.adaptabilidad, reverse=True)
    total = len(individuos)
    probabilidades = [(total - i) / sum(range(1, total + 1)) for i in range(total)]
    seleccionados = random.choices(individuos, weights=probabilidades, k=total)
    return seleccionados

def seleccion_aleatoria(individuos=None):
    individuos = individuos or poblacion
    return random.choices(individuos, k=len(individuos))

def seleccion_torneo(individuos=None, k=3):
    individuos = individuos or poblacion
    seleccionados = []
    for _ in range(len(individuos)):
        torneo = random.sample(individuos, k)
        ganador = max(torneo, key=lambda x: x.adaptabilidad)
        seleccionados.append(ganador)
    return seleccionados

def aplicar_seleccion(individuos=None):
    if tipo_algoritmo == "ranking":
        return seleccion_ranking(individuos)
    elif tipo_algoritmo == "aleatorio":
        return seleccion_aleatoria(individuos)
    elif tipo_algoritmo == "torneo":
        return seleccion_torneo(individuos)
    else:
        return seleccion_ruleta(individuos)

def cruzar(p1, p2):
    punto = random.randint(1, len(p1.bin) - 1)
    hijo_bin = p1.bin[:punto] + p2.bin[punto:]

    # Divide la cadena binaria en 6 segmentos
    bin_a = hijo_bin[:bits]
    bin_b = hijo_bin[bits:bits*2]
    bin_c = hijo_bin[bits*2:bits*3]
    bin_d = hijo_bin[bits*3:bits*4]
    bin_e = hijo_bin[bits*4:bits*5]
    bin_f = hijo_bin[bits*5:]

    val_a = decodificar(bin_a, rangos['a'])
    val_b = decodificar(bin_b, rangos['b'])
    val_c = decodificar(bin_c, rangos['c'])
    val_d = decodificar(bin_d, rangos['d'])
    val_e = decodificar(bin_e, rangos['e'])
    val_f = decodificar(bin_f, rangos['f'])

    return Elemento(hijo_bin, val_a, val_b, val_c, val_d, val_e, val_f)

def mutar(elemento, prob=0.01):
    nueva = ''.join('0' if bit == '1' and random.random() < prob else '1' if bit == '0' and random.random() < prob else bit for bit in elemento.bin)

    bin_a = nueva[:bits]
    bin_b = nueva[bits:bits*2]
    bin_c = nueva[bits*2:bits*3]
    bin_d = nueva[bits*3:bits*4]
    bin_e = nueva[bits*4:bits*5]
    bin_f = nueva[bits*5:]

    val_a = decodificar(bin_a, rangos['a'])
    val_b = decodificar(bin_b, rangos['b'])
    val_c = decodificar(bin_c, rangos['c'])
    val_d = decodificar(bin_d, rangos['d'])
    val_e = decodificar(bin_e, rangos['e'])
    val_f = decodificar(bin_f, rangos['f'])

    return Elemento(nueva, val_a, val_b, val_c, val_d, val_e, val_f)

def generar_poblacion():
    global poblacion

    if None in (rangos['a'], rangos['b'], rangos['c'], rangos['d'], rangos['e'], rangos['f']):
        raise ValueError("Los rangos no están definidos para todos los coeficientes (a,b,c,d,e,f). Debes llamar a /add-values primero.")

    poblacion = []
    cantidad = random.randint(16, 1024)
    if cantidad % 2 != 0:
        cantidad += 1

    for _ in range(cantidad):
        a = generar_valor_aleatorio(rangos['a'])
        b = generar_valor_aleatorio(rangos['b'])
        c = generar_valor_aleatorio(rangos['c'])
        d = generar_valor_aleatorio(rangos['d'])
        e = generar_valor_aleatorio(rangos['e'])
        f = generar_valor_aleatorio(rangos['f'])

        bin_a = buscar_binario(a, mapas['a'])
        bin_b = buscar_binario(b, mapas['b'])
        bin_c = buscar_binario(c, mapas['c'])
        bin_d = buscar_binario(d, mapas['d'])
        bin_e = buscar_binario(e, mapas['e'])
        bin_f = buscar_binario(f, mapas['f'])

        bin_total = bin_a + bin_b + bin_c + bin_d + bin_e + bin_f
        poblacion.append(Elemento(bin_total, a, b, c, d, e, f))


def evolucionar(generaciones=50, umbral=0.01):
    global poblacion, mejores_por_generacion, pila, error_por_generacion, numero_generaciones
    mejores_por_generacion.clear()
    error_por_generacion.clear()
    erro_anterior = None
    pila = []
    contador = 1

    for gen in range(generaciones):
        evaluar_poblacion()
        poblacion.sort(key=lambda e: e.adaptabilidad, reverse=True)

        # Calcular error promedio y guardar el mejor organismo
        errores = [calcular_error(e.a, e.b, e.c, e.d, e.e, e.f) for e in poblacion]
        promedio_error = sum(errores) / len(errores)

        mejor_actual = max(poblacion, key=lambda e: e.adaptabilidad)
        mejores_por_generacion.append(mejor_actual)
        error_por_generacion.append(promedio_error)

        # Verificación de criterio de paro
        if criterio_paro["tipo"] == "error_absoluto":
            if mejor_actual.adaptabilidad >= (1 - umbral):
                break

        elif criterio_paro["tipo"] == "mejora_progresiva":
            if erro_anterior is not None:
                mejora = (erro_anterior - promedio_error) / erro_anterior if erro_anterior > 0 else 0
                if mejora < 0.01:
                    break
            erro_anterior = promedio_error

        elif criterio_paro["tipo"] == "numero_generaciones":
            if contador >= numero_generaciones:
                break

        # Inicializar o actualizar pila
        if gen == 0:
            pila = poblacion[:2]
        else:
            for nuevo in poblacion:
                for i in range(len(pila)):
                    if nuevo.adaptabilidad > pila[i].adaptabilidad:
                        pila[i] = nuevo
                        break

        resto_pob = [p for p in poblacion if p not in pila]
        seleccionados = aplicar_seleccion(resto_pob)

        nueva_pob = pila.copy()

        for i in range(0, len(seleccionados) - 1, 2):
            hijo = cruzar(seleccionados[i], seleccionados[i + 1])
            hijo = mutar(hijo)
            nueva_pob.append(hijo)

        while len(nueva_pob) < len(poblacion):
            nueva_pob.append(random.choice(resto_pob))

        poblacion = nueva_pob
        contador += 1


# --------------------------
# Rutas FastAPI
# --------------------------

@app.post('/add-values')
def agregar(params: Parametros):
    print(params)
    global numero_generaciones, tipo_algoritmo, error_aceptacion
    rangos['a'], rangos['b'], rangos['c'] = ast.literal_eval(params.rangoa), ast.literal_eval(params.rangob), ast.literal_eval(params.rangoc)
    rangos['d'], rangos['e'], rangos['f'] = ast.literal_eval(params.rangod), ast.literal_eval(params.rangoe), ast.literal_eval(params.rangof)
    numero_generaciones = params.generaciones or 50
    tipo_algoritmo = params.tipo_algoritmo or "ruleta"
    error_aceptacion = params.error or 0.01
    mapas['a'], _ = mapear(rangos['a'])
    mapas['b'], _ = mapear(rangos['b'])
    mapas['c'], _ = mapear(rangos['c'])
    mapas['d'], _ = mapear(rangos['d'])
    mapas['e'], _ = mapear(rangos['e'])
    mapas['f'], _ = mapear(rangos['f'])

    generar_malla_puntos()
    criterio_paro["tipo"] = params.criterio
    return {'message': 'Función original y rangos definidos'}

@app.post('/generate-organisms')
def generar_organismos():
    global numero_generaciones, error_aceptacion
    generar_poblacion()
    evolucionar(numero_generaciones, error_aceptacion)
    return {'message': 'Organismos generados y evolucionados'}

@app.get('/get-best')
def get_best():
    if not poblacion:
        return []
    mejores = [
        vars(e) for e in poblacion
        if e.adaptabilidad is not None and e.adaptabilidad >= 0.85
    ]
    return mejores

@app.get('/get-evolution')
def get_evolution():
    return [
        {
            "generacion": i,
            "a": e.a,
            "b": e.b,
            "c": e.c,
            "d": e.d,
            "e": e.e,
            "f": e.f,
            "adaptabilidad": e.adaptabilidad
        }
        for i, e in enumerate(mejores_por_generacion)
    ]

@app.get('/get-original')
def get_valores_originales():
    return funcion_original

@app.get('/promedio-error')
def get_promedio():
    return [
        {"generacion": i, "error": err}
        for i, err in enumerate(error_por_generacion)
    ]
    
@app.get('/get-original-points')
def get_original_points():
    if not puntos_x or not puntos_y or not puntos_z_original:
        generar_malla_puntos()
    return {
        "x": puntos_x or [],
        "y": puntos_y or [],
        "z": puntos_z_original or []
    }
    
@app.get("/get-mesh-points")
def get_mesh_points():
    if not mejores_por_generacion:
        return {
            "original": {"x": [], "y": [], "z": []},
            "organism": {"x": [], "y": [], "z": []}
        }

    best = mejores_por_generacion[-1]

    size = int(len(puntos_x) ** 0.5)
    x_vals = puntos_x[:]
    y_vals = puntos_y[:]
    z_original = puntos_z_original[:]

    X = np.array(x_vals).reshape((size, size))
    Y = np.array(y_vals).reshape((size, size))
    Z_orig = np.array(z_original).reshape((size, size))
    Z_org = np.zeros_like(Z_orig)

    for i in range(size):
        for j in range(size):
            x = X[i, j]
            y = Y[i, j]
            Z_org[i, j] = (
                best.a * x ** 2 + best.b * y ** 2 + best.c * x * y +
                best.d * x + best.e * y + best.f
            )

    return {
        "original": {
            "x": X[0].tolist(),
            "y": [row[0] for row in Y],
            "z": Z_orig.tolist()
        },
        "organism": {
            "x": X[0].tolist(),
            "y": [row[0] for row in Y],
            "z": Z_org.tolist()
        }
    }