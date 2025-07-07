from pydantic import BaseModel

class Parametros(BaseModel):
    rangoa: str
    rangob: str
    rangoc: str
    criterio: str