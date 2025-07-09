# 🧬 Algoritmo Genético con FastAPI + React

Este proyecto implementa un algoritmo genético para ajustar una función cuadrática `ax² + bx + c` a un conjunto de puntos generados desde una función original fija.

### 1. Clonar el repositorio

```bash
git clone https://github.com/JoseAngelVirgenEslava2/AGweb.git
```


### 2 (opcional). Si no se tiene creado un entorno virtual hacer lo siguiente:
```bash
python -m venv nombre_entorno_virtual
```

Después de crear el entorno virtual, hacer esto para activarlo:

```bash
Importante: asegurarse de estar en la ruta donde se creo el entorno virtual, si no acceder a ella o agregarla en el nombre del entorno
source nombre_entorno_virtual/bin/activate
```

Para desactivar el entorno virtual:

```bash
deactivate
```


### 2. Instalar FastAPI, Uvicorn y Pydantic (se recomienda usar un entorno virtual)

```bash
pip install fastapi uvicorn pydantic
```

### 3. Ejecutar el servidor

```bash
uvicorn servidor:app --reload
```

Al hacerlo, se obtendrá una salida como la siguiente:

```
$ uvicorn servidor:app --reload
INFO:     Will watch for changes in these directories: ['/home/e/Documents/AngelEslava/AGweb']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [11183] using StatReload
INFO:     Started server process [11192]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 4. Ir a la ruta donde esta el front-end

```bash
Asegurarse que se esta en la carpeta de AGweb: pwd
cd pagina
```

### 5. Instalar dependencias

```bash
npm install
npm install recharts
```

### 6. Ejecutar la aplicacion

```bash
npm run dev
```

### 9. Instalar las dependencias para el entorno siguiendo los pasos anteriores
