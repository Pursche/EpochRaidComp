#!/usr/bin/env python3
"""
Test script for the validate_specialization_json function
"""
import json
import sys
import os

# Import the validation function from app.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import validate_specialization_json

def test_valid_specialization():
    """Test with a valid specialization JSON"""
    valid_spec = {
        "name": "Arms Warrior",
        "class": "Warrior",
        "icon_path": "icons/arms_warrior.png",
        "effects": [
            {
                "name": "Battle Shout",
                "type": "buff",
                "scope": "raid",
                "description": "Increases attack power by 185 for all raid members"
            }
        ]
    }
    
    result = validate_specialization_json(valid_spec)
    print(f"✅ Valid specialization: {'PASS' if result else 'FAIL'}")
    return result

def test_missing_required_fields():
    """Test with missing required fields"""
    invalid_spec = {
        "name": "Arms Warrior",
        "class": "Warrior",
        # Missing icon_path and effects
    }
    
    result = validate_specialization_json(invalid_spec)
    print(f"✅ Missing required fields: {'PASS' if not result else 'FAIL'}")
    return not result

def test_invalid_effect_type():
    """Test with invalid effect type"""
    invalid_spec = {
        "name": "Arms Warrior",
        "class": "Warrior",
        "icon_path": "icons/arms_warrior.png",
        "effects": [
            {
                "name": "Invalid Effect",
                "type": "invalid_type",  # Invalid type
                "scope": "raid",
                "description": "This should fail"
            }
        ]
    }
    
    result = validate_specialization_json(invalid_spec)
    print(f"✅ Invalid effect type: {'PASS' if not result else 'FAIL'}")
    return not result

def test_invalid_effect_scope():
    """Test with invalid effect scope"""
    invalid_spec = {
        "name": "Arms Warrior",
        "class": "Warrior",
        "icon_path": "icons/arms_warrior.png",
        "effects": [
            {
                "name": "Invalid Effect",
                "type": "buff",
                "scope": "invalid_scope",  # Invalid scope
                "description": "This should fail"
            }
        ]
    }
    
    result = validate_specialization_json(invalid_spec)
    print(f"✅ Invalid effect scope: {'PASS' if not result else 'FAIL'}")
    return not result

def test_empty_strings():
    """Test with empty string values"""
    invalid_spec = {
        "name": "",  # Empty string
        "class": "Warrior",
        "icon_path": "icons/arms_warrior.png",
        "effects": []
    }
    
    result = validate_specialization_json(invalid_spec)
    print(f"✅ Empty name string: {'PASS' if not result else 'FAIL'}")
    return not result

def test_wrong_data_types():
    """Test with wrong data types"""
    invalid_spec = {
        "name": 123,  # Should be string
        "class": "Warrior",
        "icon_path": "icons/arms_warrior.png",
        "effects": "not_an_array"  # Should be array
    }
    
    result = validate_specialization_json(invalid_spec)
    print(f"✅ Wrong data types: {'PASS' if not result else 'FAIL'}")
    return not result

def test_real_specialization_files():
    """Test with actual specialization files from the specializations folder"""
    spec_dir = "specializations"
    if not os.path.exists(spec_dir):
        print("❌ Specializations directory not found")
        return False
    
    json_files = [f for f in os.listdir(spec_dir) if f.endswith('.json') and f != 'specialization_schema.json']
    
    print(f"\nTesting {len(json_files)} real specialization files:")
    all_valid = True
    
    for filename in json_files:
        file_path = os.path.join(spec_dir, filename)
        try:
            with open(file_path, 'r') as f:
                spec_data = json.load(f)
            
            result = validate_specialization_json(spec_data)
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {filename}: {status}")
            
            if not result:
                all_valid = False
                
        except Exception as e:
            print(f"  {filename}: ❌ ERROR - {e}")
            all_valid = False
    
    return all_valid

def run_all_tests():
    """Run all validation tests"""
    print("Specialization JSON Validation Tests")
    print("=" * 40)
    
    tests = [
        test_valid_specialization,
        test_missing_required_fields,
        test_invalid_effect_type,
        test_invalid_effect_scope,
        test_empty_strings,
        test_wrong_data_types,
        test_real_specialization_files
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 40)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All validation tests passed!")
        return True
    else:
        print("⚠️  Some tests failed - check the output above")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1) 