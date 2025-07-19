// DIMS Dashboard - Main Application Logic

class DIMSApp {
    constructor() {
        this.config = null;
        this.currentData = null;
        this.currentTranscript = null;
        this.currentVideoID = null;
        this.lastClickedPoint = null;
        this.timeSlider = null;
    }

    async initialize() {
        try {
            this.showStatus('Loading configuration...');
            
            // Load configuration
            this.config = await this.loadJSON('config.json');
            
            if (!this.config) {
                throw new Error('Failed to load config.json');
            }
            
            this.showStatus('Setting up interface...');
            
            // Setup UI
            this.setupHeader();
            this.setupControls();
            this.setupEventListeners();
            
            // Load first video by default
            if (this.config.videoIDs && this.config.videoIDs.length > 0) {
                const firstVideoID = this.config.videoIDs[0];
                document.getElementById('videoSelect').value = firstVideoID;
                await this.loadVideoData(firstVideoID);
            } else {
                this.showStatus('No videos configured. Please check config.json');
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError(`Failed to initialize: ${error.message}`);
        }
    }

    setupHeader() {
        try {
            const titleEl = document.getElementById('title');
            const subtitleEl = document.getElementById('subtitle');
            const authorsEl = document.getElementById('authors');
            const contactsEl = document.getElementById('contacts');
            
            if (titleEl) titleEl.textContent = this.config.title || 'DIMS Dashboard';
            if (subtitleEl) subtitleEl.textContent = this.config.subtitle || '';
            if (authorsEl) authorsEl.textContent = this.config.authors || '';
            if (contactsEl) contactsEl.textContent = this.config.contacts || '';
        } catch (error) {
            console.error('Error setting up header:', error);
        }
    }

    setupControls() {
        try {
            // Populate video selector
            const videoSelect = document.getElementById('videoSelect');
            if (!videoSelect) {
                console.error('Video select element not found');
                return;
            }
            
            videoSelect.innerHTML = '<option value="">Select a video...</option>';
            
            if (this.config.videoIDs && Array.isArray(this.config.videoIDs)) {
                this.config.videoIDs.forEach(videoID => {
                    const option = document.createElement('option');
                    option.value = videoID;
                    option.textContent = videoID;
                    videoSelect.appendChild(option);
                });
            }

            // Set default window size
            const windowSizeEl = document.getElementById('windowSize');
            if (windowSizeEl && this.config.defaultWindowSize) {
                windowSizeEl.value = this.config.defaultWindowSize;
            }
        } catch (error) {
            console.error('Error setting up controls:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('videoSelect').addEventListener('change', (e) => {
            this.loadVideoData(e.target.value);
        });
        
        document.getElementById('windowSize').addEventListener('change', () => {
            if (this.lastClickedPoint !== null) {
                this.handleTimeClick(this.lastClickedPoint);
            }
        });
    }

    async loadJSON(url) {
        try {
            console.log(`Attempting to load JSON from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`Successfully loaded JSON from: ${url}`, data);
            return data;
        } catch (error) {
            console.error(`Failed to load JSON from ${url}:`, error);
            if (error.name === 'SyntaxError') {
                console.error('Invalid JSON format');
            }
            return null;
        }
    }

    async loadCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            return Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
        } catch (error) {
            console.warn(`Failed to load CSV: ${url}`, error);
            return null;
        }
    }

    cleanTimeseriesData(data) {
        // Check if time values reset (wrap around)
        let wrapDetected = false;
        let wrapIndex = -1;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i].Time < data[i-1].Time) {
                console.warn(`Time wrap detected at index ${i}: ${data[i-1].Time} -> ${data[i].Time}`);
                wrapDetected = true;
                wrapIndex = i;
                break;
            }
        }
        
        if (wrapDetected) {
            // Return only the first segment before the wrap
            console.log(`Removing wrapped data after index ${wrapIndex}`);
            return data.slice(0, wrapIndex);
        }
        
        return data;
    }

    async loadDataForVideoID(videoID) {
        const dataTypes = this.config.dataTypes[videoID] || [];
        
        // Load all timeseries files for this video ID
        const timeseriesPromises = dataTypes.map(dataType => 
            this.loadCSV(`assets/timeseries/${videoID}_${dataType}.csv`)
        );
        
        const [timeseriesResults, transcript] = await Promise.all([
            Promise.all(timeseriesPromises),
            this.loadJSON(`assets/transcripts/${videoID}_transcript.json`)
        ]);
        
        // Keep datasets separate instead of merging
        const datasets = [];
        dataTypes.forEach((dataType, index) => {
            if (timeseriesResults[index] && timeseriesResults[index].data) {
                const rawData = timeseriesResults[index].data;
                const cleanedData = this.cleanTimeseriesData(rawData);
                
                console.log(`Dataset ${dataType}:`, {
                    rawRows: rawData.length,
                    cleanedRows: cleanedData.length,
                    columns: Object.keys(cleanedData[0] || {}),
                    timeRange: cleanedData.length > 0 ? [cleanedData[0].Time, cleanedData[cleanedData.length - 1].Time] : []
                });
                
                datasets.push({
                    name: dataType,
                    data: cleanedData
                });
            }
        });
        
        console.log('Loaded datasets:', datasets);
        
        return {
            timeseries: datasets,
            transcript: transcript
        };
    }

    getTranscriptForSegment(transcript, startTime, endTime) {
        if (!transcript || !transcript.segments) return "No transcript available";
        
        const segmentTranscript = [];
        transcript.segments.forEach(segment => {
            const segStart = segment.start;
            const segEnd = segment.end;
            
            // Check if segment overlaps with our time range
            if ((startTime <= segStart && segStart < endTime) || 
                (startTime < segEnd && segEnd <= endTime) || 
                (segStart <= startTime && segEnd >= endTime)) {
                segmentTranscript.push(`[${segment.speaker}]: ${segment.text}`);
            }
        });
        
        return segmentTranscript.length > 0 ? segmentTranscript.join(' ') : "No transcript for this time range";
    }

    createTimeSlider(minTime, maxTime, onChange) {
        const container = document.getElementById('timeSlider');
        container.innerHTML = '';
        
        // Create range slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = minTime;
        slider.max = maxTime;
        slider.value = minTime;
        slider.step = 0.1;
        slider.style.width = '100%';
        slider.style.background = '#444';
        
        const valueDisplay = document.createElement('div');
        valueDisplay.style.textAlign = 'center';
        valueDisplay.style.marginTop = '10px';
        valueDisplay.style.color = '#888';
        
        const updateDisplay = () => {
            valueDisplay.textContent = `Time: ${parseFloat(slider.value).toFixed(1)}s / ${maxTime.toFixed(1)}s`;
        };
        
        slider.addEventListener('input', () => {
            updateDisplay();
            if (onChange) onChange(parseFloat(slider.value));
        });
        
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        updateDisplay();
        
        return slider;
    }

    plotTimeseries(datasets, selectedTime = null) {
        if (!datasets || datasets.length === 0) {
            document.getElementById('plotContainer').innerHTML = '<div class="error">No data to plot</div>';
            return;
        }
        
        // Create subplots for each dataset
        const traces = [];
        const annotations = [];
        
        datasets.forEach((dataset, i) => {
            if (!dataset.data || dataset.data.length === 0) return;
            
            // Sort data by time to prevent wrapping
            const sortedData = [...dataset.data].sort((a, b) => a.Time - b.Time);
            
            // Get all columns except Time for this dataset
            const columns = Object.keys(sortedData[0]).filter(col => col !== 'Time');
            
            // If multiple columns, create a single averaged trace
            if (columns.length > 1) {
                // Average all columns for this dataset
                const avgY = sortedData.map(row => {
                    const values = columns.map(col => row[col]).filter(v => v !== null && v !== undefined);
                    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                });
                
                traces.push({
                    x: sortedData.map(d => d.Time),
                    y: avgY,
                    type: 'scatter',
                    mode: 'lines',
                    name: `${dataset.name} (averaged)`,
                    yaxis: `y${i + 1}`,
                    line: { color: `hsl(${i * 360 / datasets.length}, 70%, 50%)` }
                });
            } else if (columns.length === 1) {
                // Single column - plot directly
                traces.push({
                    x: sortedData.map(d => d.Time),
                    y: sortedData.map(d => d[columns[0]]),
                    type: 'scatter',
                    mode: 'lines',
                    name: dataset.name,
                    yaxis: `y${i + 1}`,
                    line: { color: `hsl(${i * 360 / datasets.length}, 70%, 50%)` }
                });
            }
            
            annotations.push({
                text: dataset.name,
                x: 0.02,
                y: 1 - (i / datasets.length) - 0.02,
                xref: 'paper',
                yref: 'paper',
                xanchor: 'left',
                yanchor: 'top',
                showarrow: false,
                font: { color: 'white', size: 12 }
            });
        });
        
        // Create layout with subplots
        const layout = {
            title: {
                text: `ROI Synchrony Over Time for Video ${this.currentVideoID}`,
                font: { color: 'white' }
            },
            paper_bgcolor: '#111',
            plot_bgcolor: '#222',
            font: { color: 'white' },
            xaxis: {
                title: 'Time (s)',
                color: 'white',
                gridcolor: '#444'
            },
            annotations: annotations,
            height: 800,
            margin: { t: 80, r: 50, b: 80, l: 50 },
            showlegend: false
        };
        
        // Add y-axes for each subplot
        datasets.forEach((dataset, i) => {
            const yAxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
            layout[yAxisKey] = {
                title: '',
                color: 'white',
                gridcolor: '#444',
                domain: [1 - (i + 1) / datasets.length + 0.02, 1 - i / datasets.length - 0.02]
            };
        });
        
        // Add highlight for selected time
        if (selectedTime !== null) {
            const windowSize = parseInt(document.getElementById('windowSize').value) || 5;
            const startTime = Math.max(0, selectedTime - windowSize / 2);
            const endTime = selectedTime + windowSize / 2;
            
            layout.shapes = datasets.map((dataset, i) => ({
                type: 'rect',
                x0: startTime,
                x1: endTime,
                y0: 0,
                y1: 1,
                yref: `y${i + 1} domain`,
                fillcolor: 'rgba(255, 255, 255, 0.3)',
                line: { color: 'white', width: 2 }
            }));
        }
        
        Plotly.newPlot('plotContainer', traces, layout, { responsive: true });
        
        // Add click handler
        document.getElementById('plotContainer').on('plotly_click', (data) => {
            if (data.points && data.points.length > 0) {
                const clickedTime = data.points[0].x;
                this.handleTimeClick(clickedTime);
            }
        });
    }

    handleTimeClick(time) {
        this.lastClickedPoint = time;
        const windowSize = parseInt(document.getElementById('windowSize').value) || 5;
        
        // Update plot with highlight
        this.plotTimeseries(this.currentData, time);
        
        // Update videos
        this.updateVideos(time, windowSize);
        
        // Update transcript
        this.updateTranscript(time, windowSize);
        
        // Update status
        document.getElementById('status').textContent = 
            `Selected time: ${time.toFixed(2)}s (window: ${windowSize}s)`;
    }

    updateVideos(clickTime, windowSize) {
        const videoSrc = `assets/videos/${this.currentVideoID}.mp4`;
        const startTime = Math.max(0, clickTime - windowSize / 2);
        const endTime = clickTime + windowSize / 2;
        
        console.log('=== VIDEO UPDATE DEBUG ===');
        console.log('Video source:', videoSrc);
        console.log('Click time:', clickTime);
        console.log('Window size:', windowSize);
        console.log('Start time:', startTime);
        console.log('End time:', endTime);
        
        // Full video - different approach
        const fullVideoContainer = document.getElementById('fullVideoContainer');
        if (fullVideoContainer) {
            console.log('Rendering full video component...');
            try {
                // For full video, we'll create a simpler video element if the component has issues
                if (this.config.useSimpleVideoForFull) {
                    // Fallback: Create a simple video element
                    fullVideoContainer.innerHTML = `
                        <h3 style="color: white;">Full Video</h3>
                        <video src="${videoSrc}" controls style="width: 100%;" preload="metadata"></video>
                    `;
                    console.log('Full video rendered with simple HTML video element');
                } else {
                    // Use the React component but without startTime
                    ReactDOM.render(
                        React.createElement(window.TimeRangeVideo, {
                            src: videoSrc,
                            title: 'Full Video'
                        }),
                        fullVideoContainer
                    );
                    console.log('Full video component rendered successfully');
                }
            } catch (error) {
                console.error('Error rendering full video:', error);
                // Fallback to simple video element
                fullVideoContainer.innerHTML = `
                    <h3 style="color: white;">Full Video</h3>
                    <video src="${videoSrc}" controls style="width: 100%;" preload="metadata"></video>
                `;
            }
        } else {
            console.error('fullVideoContainer element not found!');
        }
        
        // Segment video - keep as is since it works
        const segmentVideoContainer = document.getElementById('segmentVideoContainer');
        if (segmentVideoContainer) {
            console.log('Rendering segment video component...');
            try {
                ReactDOM.render(
                    React.createElement(window.TimeRangeVideo, {
                        src: videoSrc,
                        startTime: startTime,
                        endTime: endTime,
                        title: `Selected Segment (${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s)`
                    }),
                    segmentVideoContainer
                );
                console.log('Segment video component rendered successfully');
            } catch (error) {
                console.error('Error rendering segment video:', error);
            }
        } else {
            console.error('segmentVideoContainer element not found!');
        }
        
        // Debug: Check what's actually rendered
        setTimeout(() => {
            console.log('=== POST-RENDER CHECK ===');
            const fullVideo = fullVideoContainer?.querySelector('video');
            const segmentVideo = segmentVideoContainer?.querySelector('video');
            
            if (fullVideo) {
                console.log('Full video element found:', {
                    src: fullVideo.src,
                    currentTime: fullVideo.currentTime,
                    paused: fullVideo.paused,
                    readyState: fullVideo.readyState
                });
                
                // Add event listeners to debug
                fullVideo.addEventListener('loadedmetadata', () => {
                    console.log('Full video metadata loaded');
                }, { once: true });
                
                fullVideo.addEventListener('error', (e) => {
                    console.error('Full video error:', e);
                }, { once: true });
            } else {
                console.log('No full video element found');
            }
            
            if (segmentVideo) {
                console.log('Segment video element found:', {
                    src: segmentVideo.src,
                    currentTime: segmentVideo.currentTime,
                    paused: segmentVideo.paused,
                    readyState: segmentVideo.readyState
                });
            }
        }, 500);
    }

    updateTranscript(clickTime, windowSize) {
        const startTime = Math.max(0, clickTime - windowSize / 2);
        const endTime = clickTime + windowSize / 2;
        const transcriptText = this.getTranscriptForSegment(this.currentTranscript, startTime, endTime);
        
        document.getElementById('transcriptDisplay').textContent = transcriptText;
    }

    async loadVideoData(videoID) {
        if (!videoID) return;
        
        this.showStatus('Loading data...');
        
        try {
            const data = await this.loadDataForVideoID(videoID);
            this.currentData = data.timeseries;
            this.currentTranscript = data.transcript;
            this.currentVideoID = videoID;
            
            if (this.currentData && this.currentData.length > 0) {
                // Create time slider - find min/max across all datasets
                let minTime = Infinity;
                let maxTime = -Infinity;
                
                this.currentData.forEach(dataset => {
                    if (dataset.data && dataset.data.length > 0) {
                        const timeValues = dataset.data.map(d => d.Time).filter(t => t !== undefined);
                        minTime = Math.min(minTime, ...timeValues);
                        maxTime = Math.max(maxTime, ...timeValues);
                    }
                });
                
                if (minTime !== Infinity && maxTime !== -Infinity) {
                    this.timeSlider = this.createTimeSlider(minTime, maxTime, (time) => this.handleTimeClick(time));
                    
                    // Plot initial data
                    this.plotTimeseries(this.currentData);
                    
                    // Initialize videos with full video
                    this.updateVideos(minTime, this.config.defaultWindowSize);
                    
                    // Initialize transcript
                    this.updateTranscript(minTime, this.config.defaultWindowSize);
                    
                    this.showStatus(`Loaded data for ${videoID}. Click on any point to segment video.`);
                } else {
                    this.showStatus('No valid time data found for this video ID.');
                }
            } else {
                this.showStatus('No valid data found for this video ID.');
            }
        } catch (error) {
            console.error('Error loading video data:', error);
            this.showError('Error loading data. Check console for details.');
        }
    }

    testVideoPlayback() {
        console.log('=== VIDEO PLAYBACK TEST ===');
        
        // Test 1: Create a simple video element
        const testVideo = document.createElement('video');
        testVideo.src = `assets/videos/${this.currentVideoID}.mp4`;
        testVideo.controls = true;
        testVideo.style.width = '300px';
        testVideo.style.border = '2px solid red';
        
        testVideo.addEventListener('loadedmetadata', () => {
            console.log('Test video metadata loaded:', {
                duration: testVideo.duration,
                videoWidth: testVideo.videoWidth,
                videoHeight: testVideo.videoHeight
            });
        });
        
        testVideo.addEventListener('error', (e) => {
            console.error('Test video error:', e);
            console.error('Video error code:', testVideo.error?.code);
            console.error('Video error message:', testVideo.error?.message);
        });
        
        // Add to page temporarily
        document.body.appendChild(testVideo);
        console.log('Test video added to page. Check if it appears with red border.');
        
        // Remove after 10 seconds
        setTimeout(() => {
            testVideo.remove();
            console.log('Test video removed');
        }, 10000);
        
        // Test 2: Check video codec support
        console.log('=== CODEC SUPPORT ===');
        const videoElement = document.createElement('video');
        console.log('MP4 H.264:', videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"'));
        console.log('MP4 H.265:', videoElement.canPlayType('video/mp4; codecs="hvc1.1.6.L93.90"'));
        console.log('WebM VP8:', videoElement.canPlayType('video/webm; codecs="vp8, vorbis"'));
        console.log('WebM VP9:', videoElement.canPlayType('video/webm; codecs="vp9"'));
        console.log('Ogg Theora:', videoElement.canPlayType('video/ogg; codecs="theora"'));
    }

    showStatus(message) {
        console.log('Status:', message);
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'status';
        } else {
            console.warn('Status element not found');
        }
    }

    showError(message) {
        console.error('Error:', message);
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'status error';
        } else {
            console.warn('Status element not found');
            alert(message); // Fallback to alert if status element doesn't exist
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing DIMS app...');
    
    // Check dependencies
    console.log('=== DEPENDENCY CHECK ===');
    console.log('React loaded:', !!window.React);
    console.log('ReactDOM loaded:', !!window.ReactDOM);
    console.log('Plotly loaded:', !!window.Plotly);
    console.log('Papa (PapaParse) loaded:', !!window.Papa);
    console.log('TimeRangeVideo component loaded:', !!window.TimeRangeVideo);
    
    // Check if required elements exist
    const requiredElements = ['status', 'videoSelect', 'windowSize', 'plotContainer', 'fullVideoContainer', 'segmentVideoContainer'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        alert(`Missing required HTML elements: ${missingElements.join(', ')}`);
        return;
    }
    
    // Check for missing dependencies
    const missingDeps = [];
    if (!window.React) missingDeps.push('React');
    if (!window.ReactDOM) missingDeps.push('ReactDOM');
    if (!window.Plotly) missingDeps.push('Plotly');
    if (!window.Papa) missingDeps.push('PapaParse');
    if (!window.TimeRangeVideo) missingDeps.push('TimeRangeVideo component');
    
    if (missingDeps.length > 0) {
        console.error('Missing dependencies:', missingDeps);
        alert(`Missing required dependencies: ${missingDeps.join(', ')}\n\nMake sure all scripts are loaded in your HTML.`);
        return;
    }
    
    const app = new DIMSApp();
    window.dimsApp = app; // Make app accessible for debugging
    app.initialize();
});