# EpochRaidComp

A comprehensive raid composition planner utility designed specifically for World of Warcraft private servers, particularly Project Epoch. This web-based tool helps raid leaders and players plan optimal raid compositions by visualizing class specializations, organizing them into groups, and tracking raid-wide and group-wide buffs, debuffs, and utility effects.

## 🎯 Overview

EpochRaidComp solves the complex problem of manually tracking raid compositions and ensures optimal coverage of important raid buffs and debuffs. It's designed for raid leaders, guild officers, and players who want to optimize their raid setups for maximum effectiveness.

## ✨ Key Features

### 🎮 Specialization Management
- **Class-based Organization**: All talent specializations grouped by class (e.g., Paladin: Protection, Holy, Retribution)
- **Visual Icons**: Each specialization displayed with custom icons and hover tooltips
- **Modular System**: Easy addition of new specializations via JSON files
- **Comprehensive Coverage**: Support for all WoW classes and their specializations

### 🏗️ Group Management
- **Flexible Structure**: Up to 8 groups with 5 slots each (40 total raid slots)
- **Drag-and-Drop Interface**: Intuitive assignment of specializations to group slots
- **Visual Feedback**: Clear indication of assigned specializations and available slots
- **Group Effects**: Display of group-wide effects under their respective groups

### 📊 Effect Tracking
- **Raid-wide Effects**: Dynamic display of all raid-wide buffs, debuffs, and utility effects
- **Real-time Updates**: Counters update automatically as specializations are assigned
- **Effect Coverage**: Ensures optimal coverage of important raid effects
- **Visual Indicators**: Clear representation of effect availability and coverage

### 💾 Persistence & Sharing
- **Auto-save**: Composition automatically saved to browser localStorage
- **Session Persistence**: Load last composition on page refresh
- **Export Functionality**: Share compositions with other raid leaders
- **Cross-browser Support**: Works across modern browsers

## 🚀 Quick Start

### Option 1: Use the Hosted Version
The easiest way to get started is to use our hosted version at **[epochraidcomp.com](https://epochraidcomp.com)**. No installation required - just open the website and start planning your raid compositions!

### Option 2: Run Locally

#### Prerequisites
- Python 3.7+
- Modern web browser with drag-and-drop support

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/EpochRaidComp.git
   cd EpochRaidComp
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
EpochRaidComp/
├── app.py                          # Flask application
├── requirements.txt                 # Python dependencies
├── README.md                       # This file
├── static/                         # Static assets
│   ├── css/
│   │   └── styles.css             # Main stylesheet
│   ├── js/
│   │   ├── app.js                 # Main application logic
│   │   └── specialization-validator.js
│   └── icons/                     # Class and specialization icons
│       ├── paladin/
│       ├── warrior/
│       └── ...                    # Other class icons
├── templates/
│   └── index.html                 # Main application template
└── specializations/               # Specialization data files
    ├── specialization_schema.json # JSON schema for specializations
    ├── paladin_holy.json
    ├── warrior_arms.json
    └── ...                        # Other specialization files
```

## 🎮 Usage

### Basic Workflow

1. **Load Specializations**: The application automatically loads all available specializations from JSON files
2. **Plan Composition**: Drag specializations from the left panel into group slots on the right
3. **Track Effects**: Monitor raid-wide effects in the bottom section as you build your composition
4. **Optimize**: Adjust your composition to ensure all important effects are covered
5. **Save**: Your composition is automatically saved and will persist between sessions

### Adding New Specializations

To add a new specialization, create a JSON file in the `specializations/` folder following this structure:

```json
{
  "name": "Holy Paladin",
  "class": "Paladin",
  "icon_path": "icons/paladin/holy.png",
  "effects": [
    {
      "name": "Blessing of Kings",
      "type": "buff",
      "scope": "raid",
      "description": "Increases all stats by 10%"
    },
    {
      "name": "Concentration Aura",
      "type": "other",
      "scope": "group",
      "description": "Reduces spell pushback by 35%"
    }
  ]
}
```

## 🛠️ Technical Details

### Architecture
- **Backend**: Flask web server serving the single-page application
- **Frontend**: HTML/CSS/JavaScript with native drag-and-drop API
- **Data Layer**: JSON file system for modular specialization data
- **Effect Engine**: Real-time calculation and display of raid effects

### Browser Compatibility
- Modern browsers with ES6+ support
- Drag-and-drop API support
- Local storage support for persistence

### Data Models

#### Specialization JSON Schema
```json
{
  "name": "string (required)",
  "class": "string (required)",
  "icon_path": "string (required)",
  "effects": [
    {
      "name": "string (required)",
      "type": "buff|debuff|other (required)",
      "scope": "raid|group (required)",
      "description": "string (required)"
    }
  ]
}
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all specializations follow the JSON schema

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for better raid composition tools in WoW private servers
- Built for the Project Epoch community
- Special thanks to all contributors and testers

## 📞 Support

If you encounter any issues or have questions/suggestions:
- Check the existing issues for solutions
- Open an issue on GitHub
or
- Talk to Pursche on the Project Epoch discord

---

**Happy raiding! 🎮⚔️**
