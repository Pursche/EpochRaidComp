from flask import Flask, render_template, send_from_directory, jsonify
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)

def validate_specialization_json(spec_data):
    """
    Validate that a specialization JSON object has the correct structure and content.
    
    Args:
        spec_data (dict): The specialization data to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Check if spec_data is a dictionary
    if not isinstance(spec_data, dict):
        return False
    
    # Required top-level fields
    required_fields = ['name', 'class', 'icon_path', 'effects']
    for field in required_fields:
        if field not in spec_data:
            return False
    
    # Validate name field
    if not isinstance(spec_data['name'], str) or len(spec_data['name'].strip()) == 0:
        return False
    
    # Validate class field (any non-empty string is allowed for extensibility)
    if not isinstance(spec_data['class'], str) or len(spec_data['class'].strip()) == 0:
        return False
    
    # Validate icon_path field
    if not isinstance(spec_data['icon_path'], str) or len(spec_data['icon_path'].strip()) == 0:
        return False
    
    # Validate effects field is an array
    if not isinstance(spec_data['effects'], list):
        return False
    
    # Validate each effect in the effects array
    for effect in spec_data['effects']:
        if not isinstance(effect, dict):
            return False
        
        # Required fields for each effect
        effect_required_fields = ['name', 'type', 'scope', 'description']
        for field in effect_required_fields:
            if field not in effect:
                return False
        
        # Validate effect name
        if not isinstance(effect['name'], str) or len(effect['name'].strip()) == 0:
            return False
        
        # Validate effect type
        valid_types = ['buff', 'debuff', 'other']
        if effect['type'] not in valid_types:
            return False
        
        # Validate effect scope
        valid_scopes = ['raid', 'group']
        if effect['scope'] not in valid_scopes:
            return False
        
        # Validate effect description
        if not isinstance(effect['description'], str) or len(effect['description'].strip()) == 0:
            return False
    
    return True

# Configure Flask to serve specializations folder as static files
@app.route('/specializations/<path:filename>')
def serve_specialization(filename):
    """Serve specialization JSON files with proper MIME type"""
    return send_from_directory('specializations', filename, mimetype='application/json')

@app.route('/specializations/')
def list_specializations():
    """List available specialization files"""
    specialization_dir = 'specializations'
    if not os.path.exists(specialization_dir):
        return jsonify([])
    
    files = []
    for filename in os.listdir(specialization_dir):
        if filename.endswith('.json') and filename != 'specialization_schema.json':
            files.append(filename)
    
    return jsonify(files)

# Configure Flask to serve icon files from subdirectories
@app.route('/icons/<path:filename>')
def serve_icon(filename):
    """Serve icon files from static/raidicons directory (legacy route)"""
    return send_from_directory('static/raidicons', filename)

@app.route('/raidicons/<path:filename>')
def serve_raidicon(filename):
    """Serve icon files from static/raidicons directory"""
    return send_from_directory('static/raidicons', filename)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True) 
