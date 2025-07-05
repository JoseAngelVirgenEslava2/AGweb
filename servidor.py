import random
from fastapi import FastAPI
import ast
from modelos.Parametros import Parametros
from modelos.Clase import Elemento
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

# Datos globales
funcion_original = {'a': None, 'b': None, 'c': None}
rangos = {'a': None, 'b': None, 'c': None}
mapas = {'a': None, 'b': None, 'c': None}
poblacion = []
puntos_x = []
puntos_y = []

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

def generar_puntos_funcion_original(n=20, rango=(-10, 10)):
    global puntos_x, puntos_y
    puntos_x = [round(random.uniform(rango[0], rango[1]), 4) for _ in range(n)]
    a, b, c = funcion_original['a'], funcion_original['b'], funcion_original['c']
    puntos_y = [a * x**2 + b * x + c for x in puntos_x]

def calcular_error(a, b, c):
    errores = [abs((a * x**2 + b * x + c) - y_real) for x, y_real in zip(puntos_x, puntos_y)]
    return sum(errores) / len(errores)

def evaluar_poblacion():
    if not poblacion:
        return []
    errores = [(elem, calcular_error(elem.a, elem.b, elem.c)) for elem in poblacion]
    max_error = max([e[1] for e in errores])
    for elem, err in errores:
        adaptabilidad = max(0.0, 1.0 - (err / max_error)) if max_error != 0 else 1.0
        elem.adaptabilidad = round(adaptabilidad, 4)
    promedio_error = sum(err for _, err in errores) / len(errores) if errores else 0
    error_por_generacion.append(round(promedio_error, 6))
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

def cruzar(p1, p2):
    punto = random.randint(1, len(p1.bin) - 1)
    hijo_bin = p1.bin[:punto] + p2.bin[punto:]
    bin_a = hijo_bin[:bits]
    bin_b = hijo_bin[bits:bits*2]
    bin_c = hijo_bin[bits*2:]
    val_a = decodificar(bin_a, rangos['a'])
    val_b = decodificar(bin_b, rangos['b'])
    val_c = decodificar(bin_c, rangos['c'])
    return Elemento(hijo_bin, val_a, val_b, val_c)

def mutar(elemento, prob=0.01):
    nueva = ''.join('0' if bit == '1' and random.random() < prob else '1' if bit == '0' and random.random() < prob else bit for bit in elemento.bin)
    bin_a = nueva[:bits]
    bin_b = nueva[bits:bits*2]
    bin_c = nueva[bits*2:]
    val_a = decodificar(bin_a, rangos['a'])
    val_b = decodificar(bin_b, rangos['b'])
    val_c = decodificar(bin_c, rangos['c'])
    return Elemento(nueva, val_a, val_b, val_c)

def generar_poblacion():
    global poblacion
    
    if None in (rangos['a'], rangos['b'], rangos['c']):
        raise ValueError("Los rangos no están definidos. Debes llamar a /add-values primero.")
    
    poblacion = []
    cantidad = random.randint(16, 1024)
    if cantidad % 2 != 0:
        cantidad += 1

    for _ in range(cantidad):
        a = generar_valor_aleatorio(rangos['a'])
        b = generar_valor_aleatorio(rangos['b'])
        c = generar_valor_aleatorio(rangos['c'])

        bin_a = buscar_binario(a, mapas['a'])
        bin_b = buscar_binario(b, mapas['b'])
        bin_c = buscar_binario(c, mapas['c'])

        bin_total = bin_a + bin_b + bin_c
        poblacion.append(Elemento(bin_total, a, b, c))
    

def evolucionar(generaciones=50, umbral=0.01):
    global poblacion, mejores_por_generacion, pila
    mejores_por_generacion = []
    pila = []

    for gen in range(generaciones):
        evaluar_poblacion()
        poblacion.sort(key=lambda e: e.adaptabilidad, reverse=True)
        mejor_actual = max(poblacion, key=lambda e: e.adaptabilidad)
        mejores_por_generacion.append(mejor_actual)
        #Se guarda al mejor organismo de esa generacion en el arreglo
        #mejores_por_generacion.append(poblacion[0])

        # Se inicializa la pila con los 2 primeros organismos segun el criterio
        if gen == 0:
            pila = poblacion[:2]
        else:
            for nuevo in poblacion:
                # Si este nuevo organismo esta mas adaptado que el i-esimo
                # organismo de la pila, se reemplaza
                for i in range(len(pila)):
                    if nuevo.adaptabilidad > pila[i].adaptabilidad:
                        pila[i] = nuevo
                        break

        #Si se cumple el criterio marcado por el umbral se detiene
        if pila and max(e.adaptabilidad for e in pila) >= (1 - umbral):
            break

        #Obtenemos al resto de la poblacion
        resto_pob = [p for p in poblacion if p not in pila]
        seleccionados = seleccion_ruleta(resto_pob)

        nueva_pob = pila.copy()

        for i in range(0, len(seleccionados) - 1, 2):
            hijo = cruzar(seleccionados[i], seleccionados[i+1])
            hijo = mutar(hijo)
            nueva_pob.append(hijo)

        # Si falta para completar la poblacion
        while len(nueva_pob) < len(poblacion):
            nueva_pob.append(random.choice(resto_pob))

        poblacion = nueva_pob

# --------------------------
# Rutas FastAPI
# --------------------------

@app.post('/add-values')
def agregar(params: Parametros):
    #print("Datos recibidos:", params)
    a, b, c = ast.literal_eval(params.a), ast.literal_eval(params.b), ast.literal_eval(params.c)
    rangoa, rangob, rangoc = ast.literal_eval(params.rangoa), ast.literal_eval(params.rangob), ast.literal_eval(params.rangoc)

    funcion_original['a'] = a
    funcion_original['b'] = b
    funcion_original['c'] = c
    rangos['a'] = rangoa
    rangos['b'] = rangob
    rangos['c'] = rangoc

    mapas['a'], _ = mapear(rangoa)
    mapas['b'], _ = mapear(rangob)
    mapas['c'], _ = mapear(rangoc)

    generar_puntos_funcion_original()
    return {'message': 'Función original y rangos definidos'}

@app.post('/generate-organisms')
def generar_organismos():
    generar_poblacion()
    evolucionar()
    return {'message': 'Organismos generados y evolucionados'}

@app.get('/get-best')
def get_best():
    if not poblacion:
        return []
    evaluar_poblacion()
    mejores = [vars(e) for e in poblacion if e.adaptabilidad >= 0.85]
    return mejores

@app.get('/get-evolution')
def get_evolution():
    #print(mejores_por_generacion)
    return [vars(e) for e in mejores_por_generacion]

@app.get('/promedio-error')
def get_promedio():
    return [
        {"generacion": i, "error": err}
        for i, err in enumerate(error_por_generacion)
    ]