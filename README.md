# Molecular Visualizer

A web application that renders 3D molecular models based on chemical formulas using Three.js and OpenAI.

## Features

- Visualize molecules in 3D based on chemical formulas
- Animate molecules with educational sequences
- Works with or without an OpenAI API key
- Default visualizations for common molecules (H2O, CO2, CH4) 

## Technologies Used

- Flask for the web framework
- Three.js for 3D rendering
- OpenAI API for molecular structure and animation generation
- Bootstrap for UI styling

## Setup and Running

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run with Flask (development): `flask run`
4. Run with Gunicorn (production): `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
5. Access at http://localhost:5000

## Usage

1. Enter a chemical formula (e.g., H2O, CO2, CH4) 
2. Optionally provide an OpenAI API key for custom molecules
3. Click "Visualize Molecule" to see the 3D model
4. Use the controls to navigate through the animation sequence