class Elemento:
    def __init__(self, binario, a, b, c):
        self.bin = binario
        self.a = a
        self.b = b
        self.c = c
        self.adaptabilidad = None

    def set_a(self, valor):
        self.a = valor

    def set_b(self, valor):
        self.b = valor

    def set_c(self, valor):
        self.c = valor

    def __repr__(self):
        return f'Elemento(a={self.a}, b={self.b}, c={self.c}, bin="{self.bin}")'
