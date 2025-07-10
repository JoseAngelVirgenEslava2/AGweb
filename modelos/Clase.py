class Elemento:
    def __init__(self, binario, a, b, c, d, e, f):
        self.bin = binario
        self.a = a
        self.b = b
        self.c = c
        self.d = d
        self.e = e
        self.f = f
        self.adaptabilidad = None

    def set_a(self, valor):
        self.a = valor

    def set_b(self, valor):
        self.b = valor

    def set_c(self, valor):
        self.c = valor

    def set_d(self, valor):
        self.d = valor

    def set_e(self, valor):
        self.e = valor

    def set_f(self, valor):
        self.f = valor

    def __repr__(self):
        return (f'Elemento(a={self.a}, b={self.b}, c={self.c}, d={self.d}, e={self.e}, f={self.f}, bin="{self.bin}")')