# Dashboard Generator

This is a desktop tool built with [Electron](https://www.electronjs.org/) to help researchers generate and prepare config files (`config.json`) and folder structures for the DIMS Dashboard.

It provides a user-friendly interface to:

- Organize video, transcript, and timeseries data into groups
- Visualize CSV column structure and preview data
- Select columns for RQA processing
- Automatically generate a valid `config.json` file
- Run an optional RQA preprocessing step using Python

---

## 📂 Directory Structure

This folder is located inside the larger `dims_dashboard/` repository:
dims_dashboard/
├── dashboard generator/
│ ├── index.html
│ ├── main.js
│ ├── preload.js (optional)
│ ├── package.json
│ ├── .gitignore
│ └── ...

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org) (version ≥ 18 recommended)
- Python (to run the optional `optional_step_RQA.py` script)

### 2. Install dependencies

From within the `dashboard generator/` directory:

```bash
npm install
### 3. Run the app

npm start
