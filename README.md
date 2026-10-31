# Analizador Estructural Web

Aplicación académica Flask para explorar:
- Viga simplemente apoyada con una carga puntual y carga uniformemente distribuida en toda la luz.
- Columna en voladizo con carga axial y carga horizontal en la cabeza.
- Pórtico de un nivel y un vano mediante una idealización didáctica de reparto simétrico de carga lateral.

## Requisitos
- Python 3.10 o superior
- Conexión a internet para cargar Plotly desde su CDN (los cálculos se ejecutan localmente).

## Instalación en Windows
1. Extrae el ZIP.
2. Abre la carpeta `analisis_estructural_web` en Visual Studio Code.
3. Abre Terminal > New Terminal.
4. Ejecuta:

```powershell
py -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python app.py
```

5. Abre http://127.0.0.1:5000 en el navegador.

Si `py` no funciona, prueba `python` en su lugar.

## Alcance y advertencias
Esta es una primera versión didáctica, no un software profesional de diseño estructural.
El módulo de pórticos usa una idealización simplificada y NO es un solucionador general de pórticos. No usar resultados para construcción, diseño o seguridad de estructuras. Antes de ampliar el sistema se debe implementar y validar un método de rigidez matricial 2D general con propiedades EI/EA, conectividad, apoyos, cargas nodales y distribuidas, liberaciones y comprobaciones independientes.
