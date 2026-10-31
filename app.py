from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

def sample(xs, ys):
    return {"x": xs, "y": ys}

def beam(data):
    # Viga simplemente apoyada, carga puntual P en x=a y carga uniforme w en todo L.
    L = float(data.get("L", 6))
    P = float(data.get("P", 10))
    a = float(data.get("a", L / 2))
    w = float(data.get("w", 0))
    if L <= 0 or P < 0 or w < 0 or not 0 <= a <= L:
        raise ValueError("Usa L > 0, P y w ≥ 0, y una posición a entre 0 y L.")
    RB = (P * a + w * L * (L / 2)) / L
    RA = P + w * L - RB
    n = 121
    xs = [L * i / (n - 1) for i in range(n)]
    V, M, N = [], [], []
    for x in xs:
        V.append(RA - w*x - (P if x >= a else 0))
        M.append(RA*x - w*x*x/2 - P*max(0, x-a))
        N.append(0)
    return {
        "kind": "Viga simplemente apoyada",
        "units": {"force": "kN", "moment": "kN·m", "length": "m"},
        "reactions": [{"label": "RA", "value": RA}, {"label": "RB", "value": RB}],
        "charts": [
            {"name": "Fuerza axial N", "x": xs, "y": N, "unit": "kN"},
            {"name": "Fuerza cortante V", "x": xs, "y": V, "unit": "kN"},
            {"name": "Momento flector M", "x": xs, "y": M, "unit": "kN·m"}
        ],
        "notes": ["Modelo: viga simplemente apoyada con carga puntual y carga uniformemente distribuida en toda la luz.",
                  "Convención: cargas verticales hacia abajo; las reacciones se muestran positivas hacia arriba.",
                  "Este módulo no incluye todavía cargas parciales, pares aplicados ni vigas continuas."]
    }

def column(data):
    # Columna en voladizo: empotrada en base, carga axial P y carga lateral H en cabeza.
    L = float(data.get("L", 3))
    P = float(data.get("P", 100))
    H = float(data.get("H", 5))
    if L <= 0 or P < 0:
        raise ValueError("Usa L > 0 y P ≥ 0. H puede ser positivo o negativo.")
    n = 101
    xs = [L*i/(n-1) for i in range(n)]
    # Signos: compresión axial negativa; cortante constante H; momento lineal H*(L-x).
    N = [-P for _ in xs]
    V = [H for _ in xs]
    M = [H*(L-x) for x in xs]
    return {
        "kind": "Columna en voladizo",
        "units": {"force": "kN", "moment": "kN·m", "length": "m"},
        "reactions": [{"label": "Axial en base", "value": P},
                      {"label": "Cortante en base", "value": -H},
                      {"label": "Momento en base", "value": -H*L}],
        "charts": [
            {"name": "Fuerza axial N", "x": xs, "y": N, "unit": "kN"},
            {"name": "Fuerza cortante V", "x": xs, "y": V, "unit": "kN"},
            {"name": "Momento flector M", "x": xs, "y": M, "unit": "kN·m"}
        ],
        "notes": ["Modelo: columna vertical en voladizo, empotrada en la base, con carga axial centrada P y carga horizontal H en la parte superior.",
                  "La compresión axial se representa negativa. El momento se calcula como H·(L-x).",
                  "No se evalúa pandeo, interacción P-M ni diseño de sección."]
    }

def portal(data):
    # Pórtico idealizado: dos columnas empotradas, dintel rígido; aproximación por distribución de carga lateral.
    # Para no presentar una solución matricial incompleta como exacta, se implementa un pórtico simétrico
    # con bases empotradas, columnas iguales y carga horizontal aplicada en el nudo superior izquierdo.
    # Se informa como modelo simplificado de equilibrio, no como análisis general de pórticos.
    H = float(data.get("H", 3.5))
    B = float(data.get("B", 5))
    Q = float(data.get("Q", 10))
    if H <= 0 or B <= 0:
        raise ValueError("La altura H y la luz B deben ser mayores que cero.")
    # Modelo de referencia: dos columnas en voladizo que comparten por igual el cortante horizontal total.
    shear_each = Q/2
    moment_each = shear_each*H
    xs = [H*i/100 for i in range(101)]
    # Diagrama representativo por columna (magnitudes), el axial se toma cero para carga horizontal pura.
    return {
        "kind": "Pórtico de un nivel y un vano (modelo simplificado)",
        "units": {"force": "kN", "moment": "kN·m", "length": "m"},
        "reactions": [{"label": "Cortante base izquierda", "value": shear_each},
                      {"label": "Cortante base derecha", "value": shear_each},
                      {"label": "Momento base izquierda", "value": moment_each},
                      {"label": "Momento base derecha", "value": moment_each}],
        "charts": [
            {"name": "Fuerza axial N (columna de referencia)", "x": xs, "y": [0 for _ in xs], "unit": "kN"},
            {"name": "Fuerza cortante V (por columna)", "x": xs, "y": [shear_each for _ in xs], "unit": "kN"},
            {"name": "Momento flector M (por columna)", "x": xs, "y": [shear_each*(H-x) for x in xs], "unit": "kN·m"}
        ],
        "notes": ["Modelo didáctico simplificado: pórtico de un nivel y un vano, con columnas de igual rigidez idealizada que comparten por igual una carga horizontal total Q.",
                  "Los diagramas mostrados corresponden a una columna representativa bajo esta idealización.",
                  "No sustituye un análisis matricial general de pórticos con rigideces EI, cargas verticales, nudos semirrígidos o geometrías arbitrarias."]
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json(force=True)
        kind = data.get("kind")
        if kind == "beam":
            result = beam(data)
        elif kind == "column":
            result = column(data)
        elif kind == "portal":
            result = portal(data)
        else:
            raise ValueError("Selecciona un módulo válido.")
        return jsonify({"ok": True, "result": result})
    except (ValueError, TypeError) as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400

if __name__ == "__main__":
    app.run(debug=True)
