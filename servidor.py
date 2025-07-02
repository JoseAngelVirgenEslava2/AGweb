import random
from fastapi import FastAPI
import ast

app = FastAPI()
funcion = {'a':10, 'b':-5, 'c':-10}
nueva_funcion = {}
bits = 8
two_n = 2**bits

def mapear(rango):
    minimo, max = float(rango[0]), float(rango[1])
    mapa = {}
    delta = (max - minimo) / (two_n - 1)
    for i in range(two_n):
        valor_decimal = round(minimo + i * delta, 6)  # redondeamos para evitar errores
        binario = format(i, f'0{bits}b')
        mapa[valor_decimal] = binario

    return mapa, delta
        
def buscar_binario(valor, mapa):
    """Buscamos el numero binario más cercano al valor ingresado"""
    valor = round(float(valor), 6)
    if valor in mapa:
        return mapa[valor]
    else:
        mas_cercano = min(mapa.keys(), key=lambda k: abs(k - valor))
        return mapa[mas_cercano]

def convert_to_binary(num, delta, min):
    result = num*delta + min
    result = round(result)
    return format(result, f'0{bits}b')

@app.get('/')
def root():
    return {'message': 'funciona'}

@app.post('/add-values')
def agregar(a, b, c, rangoa, rangob, rangoc):
    rangoa = ast.literal_eval(rangoa)
    rangob = ast.literal_eval(rangob)
    rangoc = ast.literal_eval(rangoc)
    a = ast.literal_eval(a)
    b = ast.literal_eval(b)
    c = ast.literal_eval(c)
    
    mapa_a, _ = mapear(rangoa)
    mapa_b, _ = mapear(rangob)
    mapa_c, _ = mapear(rangoc)
    
    a_binary = buscar_binario(a, mapa_a)
    b_binary = buscar_binario(b, mapa_b)
    c_binary = buscar_binario(c, mapa_c)
    
    nueva_funcion['a'] = a_binary
    nueva_funcion['b'] = b_binary
    nueva_funcion['c'] = c_binary
    
    return {'message':'valores agregados'}

@app.get('/get-values')
def obtener():
    return nueva_funcion
