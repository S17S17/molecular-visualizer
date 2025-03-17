from flask import Flask, render_template, request, session, redirect, url_for
import os
import json
import re
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/animate', methods=['POST'])
def animate():
    # Get form data
    formula = request.form.get('formula', 'H2O')
    api_key = request.form.get('api_key', '')
    
    # Store in session
    session['formula'] = formula
    session['api_key'] = api_key
    
    # Default structure for H2O if no API key provided
    structure = {
        'atoms': [
            {'element': 'O', 'position': [0, 0, 0]},
            {'element': 'H', 'position': [1, 0, 0]},
            {'element': 'H', 'position': [-1, 0, 0]}
        ],
        'description': 'Water (H₂O) molecule with oxygen at center and two hydrogen atoms.'
    }
    
    animation_sequence = [
        'Rotate the molecule 360 degrees around the Y-axis',
        'Zoom in to show the oxygen atom',
        'Zoom out to show the full molecule',
        'Vibrate the hydrogen atoms slightly',
        'Return to the original view'
    ]
    
    # If API key is provided, get structure and animation from OpenAI
    if api_key:
        try:
            openai.api_key = api_key
            
            # First prompt: Get molecular structure
            structure_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful chemistry assistant."},
                    {"role": "user", "content": f"Given the formula {formula}, describe its molecular structure with approximate 3D coordinates for each atom (e.g., C at (0,0,0), H at (1,1,1)). Format your response as a JSON object with 'atoms' array containing objects with 'element' and 'position' [x,y,z], and a 'description' field with a brief explanation of the structure."}
                ]
            )
            
            # Parse the response to extract structure
            structure_text = structure_response.choices[0].message.content
            try:
                # Try to extract JSON if it's embedded in the response
                json_match = re.search(r'\{.*\}', structure_text, re.DOTALL)
                if json_match:
                    structure = json.loads(json_match.group(0))
                else:
                    # Fallback to parsing the text manually
                    structure = parse_structure_text(structure_text, formula)
            except Exception as e:
                print(f"Error parsing structure: {e}")
                structure = parse_structure_text(structure_text, formula)
            
            # Second prompt: Get animation sequence
            animation_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful chemistry visualization assistant."},
                    {"role": "user", "content": f"Describe a 5-step educational animation sequence for a 3D {formula} molecule (e.g., rotate to show bonds, zoom into central atom, vibrate atoms). Format your response as a JSON array of 5 string descriptions."}
                ]
            )
            
            # Parse the response to extract animation sequence
            animation_text = animation_response.choices[0].message.content
            try:
                # Try to extract JSON if it's embedded in the response
                json_match = re.search(r'\[.*\]', animation_text, re.DOTALL)
                if json_match:
                    animation_sequence = json.loads(json_match.group(0))
                else:
                    # Fallback to parsing the text manually
                    animation_sequence = parse_animation_text(animation_text)
            except Exception as e:
                print(f"Error parsing animation: {e}")
                animation_sequence = parse_animation_text(animation_text)
                
        except Exception as e:
            print(f"Error with OpenAI API: {e}")
            # Continue with default values
    
    return render_template(
        'molecule.html', 
        formula=formula,
        structure=structure,
        animation_sequence=animation_sequence
    )

def parse_structure_text(text, formula):
    """Parse structure text from OpenAI if JSON parsing fails"""
    atoms = []
    lines = text.split('\n')
    
    # Extract atom positions
    for line in lines:
        if ' at ' in line.lower():
            parts = line.split(' at ')
            if len(parts) == 2:
                element = parts[0].strip().split(' ')[0]  # Get element symbol
                coords_text = parts[1].strip()
                # Extract coordinates from format like (0,0,0) or (0, 0, 0)
                coords_match = re.search(r'\(([^)]+)\)', coords_text)
                if coords_match:
                    coords_str = coords_match.group(1).replace(' ', '')
                    coords = [float(x) for x in coords_str.split(',')]
                    atoms.append({'element': element, 'position': coords})
    
    # If no atoms were found, create a default structure
    if not atoms:
        if formula.lower() == 'h2o':
            atoms = [
                {'element': 'O', 'position': [0, 0, 0]},
                {'element': 'H', 'position': [1, 0, 0]},
                {'element': 'H', 'position': [-1, 0, 0]}
            ]
        elif formula.lower() == 'co2':
            atoms = [
                {'element': 'C', 'position': [0, 0, 0]},
                {'element': 'O', 'position': [1.2, 0, 0]},
                {'element': 'O', 'position': [-1.2, 0, 0]}
            ]
        elif formula.lower() == 'ch4':
            atoms = [
                {'element': 'C', 'position': [0, 0, 0]},
                {'element': 'H', 'position': [1, 0, 0]},
                {'element': 'H', 'position': [-1, 0, 0]},
                {'element': 'H', 'position': [0, 1, 0]},
                {'element': 'H', 'position': [0, -1, 0]}
            ]
        else:
            # Generic structure
            atoms = [{'element': formula, 'position': [0, 0, 0]}]
    
    return {
        'atoms': atoms,
        'description': f"Molecular structure of {formula}"
    }

def parse_animation_text(text):
    """Parse animation text from OpenAI if JSON parsing fails"""
    animations = []
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if line and not line.startswith('#') and not line.startswith('{') and not line.startswith('}'):
            # Remove numbering if present (like "1.", "Step 1:", etc.)
            cleaned_line = re.sub(r'^(\d+[\.\):]|Step \d+:|\*)\\s*', '', line)
            if cleaned_line:
                animations.append(cleaned_line)
    
    # Ensure we have exactly 5 animation steps
    while len(animations) < 5:
        animations.append(f"Animation step {len(animations)+1}")
    
    return animations[:5]  # Return only the first 5 animations

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)