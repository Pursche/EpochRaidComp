#!/usr/bin/env python3
"""
Test script to verify that specialization JSON files are properly served by Flask
"""
import requests
import json
import sys
import os
import glob

def get_specialization_files():
    """Dynamically discover all specialization JSON files in the specializations folder"""
    specialization_dir = "specializations"
    if not os.path.exists(specialization_dir):
        print(f"❌ Error: {specialization_dir} directory not found")
        return []
    
    # Get all JSON files in the specializations directory
    json_files = glob.glob(os.path.join(specialization_dir, "*.json"))
    
    # Filter out the schema file and get just the filenames
    specialization_files = []
    for file_path in json_files:
        filename = os.path.basename(file_path)
        if filename != "specialization_schema.json":
            specialization_files.append(filename)
    
    return specialization_files

def test_specialization_endpoints():
    """Test that specialization JSON files can be fetched with correct MIME type"""
    base_url = "http://localhost:5000"
    
    # Dynamically get specialization files
    specialization_files = get_specialization_files()
    
    if not specialization_files:
        print("❌ No specialization files found to test")
        return
    
    print(f"Testing {len(specialization_files)} specialization file endpoints...")
    print(f"Files found: {', '.join(specialization_files)}")
    print("-" * 50)
    
    success_count = 0
    total_count = len(specialization_files)
    
    for filename in specialization_files:
        url = f"{base_url}/specializations/{filename}"
        try:
            response = requests.get(url)
            
            if response.status_code == 200:
                # Check MIME type
                content_type = response.headers.get('Content-Type', '')
                if 'application/json' in content_type:
                    print(f"✅ {filename}: OK (MIME type: {content_type})")
                    
                    # Verify it's valid JSON
                    try:
                        json_data = response.json()
                        if isinstance(json_data, dict):
                            print(f"   - Valid JSON with {len(json_data)} top-level keys")
                        else:
                            print(f"   - Valid JSON (not a dictionary)")
                        success_count += 1
                    except json.JSONDecodeError:
                        print(f"   - ⚠️  Warning: Response is not valid JSON")
                else:
                    print(f"❌ {filename}: Wrong MIME type ({content_type})")
            else:
                print(f"❌ {filename}: HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ {filename}: Connection failed - make sure Flask app is running")
            print("\nTo start the Flask app:")
            print("  python app.py")
            break
        except Exception as e:
            print(f"❌ {filename}: Error - {e}")
    
    print("-" * 50)
    print(f"Test Results: {success_count}/{total_count} files passed")
    
    if success_count == total_count:
        print("🎉 All specialization files are properly served!")
    elif success_count > 0:
        print("⚠️  Some files have issues - check the output above")
    else:
        print("❌ No files are working - check Flask app and network")

if __name__ == "__main__":
    print("Specialization File Access Test")
    print("=" * 40)
    test_specialization_endpoints()
    print("\nTo run this test:")
    print("1. Start the Flask app: python app.py")
    print("2. In another terminal: python test_specializations.py") 