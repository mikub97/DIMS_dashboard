# Tutorial: Deploy Your Own DIMS Dashboard with Custom Data

This tutorial walks you through setting up your own version of the DIMS Dashboard. You will learn how to visualize your own video, time series, and transcript data using a simple, browser-based dashboard. No coding experience is required.

---

## Step 0: What You Need

- A GitHub account — [create one](https://github.com/join) if you don’t have it yet
- GitHub Desktop: [download](https://desktop.github.com/)
- Your own data:
  - A video file (`.mp4`)
  - A time series file (`.csv`)
  - A transcript file (`.json`)

---

## Step 1: Fork and Clone the Dashboard Repository

1. Go to the original DIMS Dashboard repository:
   https://github.com/wimpouw/DIMS_dashboard

2. Click the **Fork** button (top-right) to create your own copy.

3. Open GitHub Desktop:
   - Go to **File > Clone Repository**
   - Choose your forked version
   - Pick a folder to clone into

---

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

> 🔍 **Note:** Some projects use a `docs/` folder to hold everything. This is useful when publishing via GitHub Pages. If your files are inside `docs/`, adjust paths accordingly and select `docs/` as the source folder in GitHub Pages settings (see Step 6).

You will only need to modify:
- The `assets/` folder — where you place your data files
- The `config.json` — which links video IDs to measurements

---

## Step 3: Add Your Own Data

### 1. Place videos in `assets/videos/`
- Video filenames (e.g. `3120.mp4`) act as unique keys (`video_key`) for linking all related data.

### 2. Place time series in `assets/timeseries/`
- Each CSV file should be named `{video_key}_{measurement}.csv`
- Example: if you have `3120.mp4` and a measurement called `bodysync`, name your file: `3120_bodysync.csv`

Each CSV should contain EXACTLY two columns:
 - Time column (required for merging)
 - One measurement column (any name you want)
For example: 
```
head_sync,Time
0.195957219,2.8
0.221350077,3.2
...

> 🔁 Time should be in seconds and aligned with your video.

### 3. Place your transcript in `assets/transcripts/`
- File should be named `{video_key}_transcript.json`
- (!!!) Format is currently custom and may be standardized in future updates.

---

## Step 4 (Optional): Generate RQA Data

To include recurrence plots (RQA):

1. Install Python: https://www.python.org/downloads/

2. Open Terminal (macOS/Linux) or Command Prompt (Windows):
   ```bash
   pip install -r optional_requirements.txt
   ```

3. Run the RQA script:
   ```bash
   python optional_step_RQA.py --config config.json --output-dir assets/rqa
   ```

This will generate JSON files with recurrence quantification analysis inside `assets/rqa/`.

---

## Step 5: Edit the Configuration File

Open `config.json` in a text editor and set it up like this:

```json
{
  "videoIDs": ["3120"],
  "dataTypes": {
    "3120": ["bodysync", "neuralsync"]
  },
  "include_RQA": ["bodysync", "neuralsync"],
  "defaultWindowSize": 5,
  "title": "My Research Dashboard",
  "subtitle": "Exploring Coordination",
  "authors": "Your Name",
  "contacts": "you@example.com"
}
```

### Explanation:
- `"videoIDs"`: List of keys (without `.mp4`) used for grouping data
- `"dataTypes"`: Which measurements (CSV files) belong to which video
- `"include_RQA"`: Which measurements to visualize using RQA plots (leave empty, if you did not make optional step 4.)

> 📌 Make sure all names match your actual filenames!

---

## Step 6: Publish with GitHub Pages

1. Push your changes using GitHub Desktop

2. On GitHub.com, go to **Settings > Pages**

3. Under **Source**, choose:
   - Branch: `main`
   - Folder: `/ (root)` — or `/docs` if you’re using a `docs/` folder

4. Click **Save**

Your dashboard will be available at:
```
https://your-username.github.io/your-dashboard/
```

---

## ✅ Done!

You now have a live, interactive DIMS dashboard using your own data. To update it, just add new files and repeat Steps 3–5.

Happy exploring!

