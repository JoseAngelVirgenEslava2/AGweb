from pydantic import BaseModel

class Parametros(BaseModel):
    rangoa: str
    rangob: str
    rangoc: str
    rangod: str
    rangoe: str
    rangof: str
    criterio: str
    generaciones: int | None = None
    tipo_algoritmo: str
    tipo_funcion: str
    error: float | None = None
    