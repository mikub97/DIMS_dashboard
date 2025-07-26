# DIMS Dashboard - Client-Side Setup Guide

Github website: https://wimpouw.github.io/DIMS_dashboard/

For step-by-step instructions on how to use this dashboard with your own data, see the [Tutorial](TUTORIAL.md).


## File Structure

To be updated

Create this exact folder structure:

```
/your-website/
├── index.html                    # Main HTML file
├── config.json                   # Dataset configuration  
├── css/
│   ├── reset.css                 # Your dashboard styles
├── js/
│   ├── app.js                    # Main application logic
│   └── video-component.js        # Enhanced video component
└── assets/
    ├── timeseries/
    │   ├── 3120_syncbody.csv      # Time + one measurement column
    │   ├── 3120_neuralsync.csv    # Time + one measurement column
    │   ├── 3120_neuralsync2.csv   # Time + one measurement column
    │   └── 3120_neuralsync3.csv   # Time + one measurement column
    ├── transcripts/
    │   └── 3120_transcript.json
    └── videos/
        └── 3120.mp4
```

## Files You Need to Create

### 1. Save the artifacts as files:
- `index.html` - The main HTML file (now uses external CSS)
- `config.json` - Configuration file
- `css/styles.css` - Dashboard styles (extracted from HTML)
- `js/app.js` - Main application logic (simplified for single-column CSVs)
- `js/video-component.js` - Enhanced video component with reliable time seeking

## optional RQA 
1. add to config
2. run script


### 2. Use your existing reset.css:
Place your existing `reset.css` in the `css/` folder.

## Simplified Data File Requirements

### CSV Files (in `assets/timeseries/`)
**Each CSV should contain EXACTLY:**
- `Time` column (required for merging)
- **One measurement column** (any name you want)

Example CSV structure:
```csv
Time,synchrony_measure
0.0,0.5
0.1,0.6
0.2,0.4
...
```

### Configuration Example
```json
{
    "videoIDs": ["3120"],
    "dataTypes": {
        "3120": ["syncbody", "neuralsync", "neuralsync2", "neuralsync3"]
    },
    "defaultWindowSize": 5,
    "title": "DIMS Dashboard",
    "subtitle": "Multimodal Synchrony Exploration Visualization",
    "authors": "Grace Qiyuan Miao, James Trujillo, Landry S. Bulls, Mark A. Thornton, Rick Dale, Wim Pouw",
    "contacts": "contacts: q.miao@ucla.edu & w.pouw@tilburguniversity.edu"
}
```

This will create 4 separate subplots:
- `syncbody_synchrony_measure`
- `neuralsync_synchrony_measure`  
- `neuralsync2_synchrony_measure`
- `neuralsync3_synchrony_measure`

## Deployment

Deploy to any static hosting service:
- **GitHub Pages**
- **Netlify** 
- **Vercel**
- **Any web server**

The video segmenting should now work reliably with the enhanced React component and simplified data structure!