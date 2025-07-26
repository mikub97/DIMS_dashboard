# Tutorial: Deploy Your Own DIMS Dashboard with Custom Data

This tutorial walks you through setting up your own version of the DIMS Dashboard. You will learn how to visualize your own video, time series, and transcript data using a simple, browser-based dashboard. No coding experience is required.

## Step 0: What You Need

- A GitHub account. You can create one at https://github.com/join
- GitHub Desktop installed: https://desktop.github.com/
- Your own data:
  - A video file (.mp4)
  - A time series file (.csv)
  - A transcript file (.json)

## Step 1: Fork and Clone the Dashboard Repository

1. Visit the original DIMS Dashboard repository:
   https://github.com/wimpouw/DIMS_dashboard

2. Click the "Fork" button in the top-right corner of the page to create your own copy.

3. Open GitHub Desktop.
   - Go to File > Clone Repository
   - Choose your forked repository
   - Select a folder on your computer and click "Clone"

## Step 2: Understand the Project Structure

Once cloned, the folder structure should look like this:

```
/your-dashboard/
├── index.html
├── config.json
├── css/
│   └── reset.css
├── js/
│   ├── app.js
│   └── video-component.js
└── assets/
    ├── timeseries/
    ├── transcripts/
    └── videos/
```

Note: Some projects place everything inside a `docs/` folder instead of the root.
This is common when using GitHub Pages and helps keep your main directory clean.
If your files are in `docs/`, make sure to adjust paths accordingly and set GitHub Pages to serve from `docs/`.

You will only modify:
- The `assets/` folder where your data files go
- The `config.json` file to point to your data

## Step 3: Add Your Own Data

1. Place your video (.mp4) in `assets/videos/`

2. Create a CSV file in `assets/timeseries/`
   - The CSV must contain two columns: `Time` and one measurement
   Example:
   ```
   Time,sync
   0.0,0.45
   0.1,0.47
   ...
   ```

3. Place your transcript in `assets/transcripts/` as a `.json` file.
   Note: The format is currently custom and may be updated in the future.

## Step 4: Edit the Configuration

Open `config.json` and make sure it reflects your data:

```json
{
  "videoIDs": ["yourvideo"],
  "dataTypes": {
    "yourvideo": ["sync"]
  },
  "include_RQA": ["sync"],
  "defaultWindowSize": 5,
  "title": "My Research Dashboard",
  "subtitle": "Exploring Coordination",
  "authors": "Your Name",
  "contacts": "you@example.com"
}
```

- Replace `yourvideo` with the name of your files (without extensions).
- Replace `sync` with your actual measurement column name.

## Step 5 (Optional): Generate RQA Data

If you want to include recurrence plots:

1. Install Python from https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. Open Terminal or Command Prompt
   - Navigate to your project directory
   - Run:
     ```
     pip install -r optional_requirements.txt
     ```

3. Run the RQA script:
   ```
   python optional_step_RQA.py --config config.json --output-dir assets/rqa
   ```

This generates recurrence data in `assets/rqa/`.

## Step 6: Publish with GitHub Pages

1. Push all your changes using GitHub Desktop

2. On GitHub.com, go to your repository > Settings > Pages

3. Under Source, select:
   - Branch: `main`
   - Folder: `/ (root)`

4. Click Save

Your dashboard will be available at:
`https://your-username.github.io/your-dashboard/`

## Done

You now have a live, interactive dashboard for your own data. You can add more videos and measurements by repeating steps 3 through 5.
