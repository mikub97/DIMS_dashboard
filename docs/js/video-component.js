// Enhanced video component with reliable time seeking
window.TimeRangeVideo = function TimeRangeVideo(props) {
    const { React } = window;
    
    const videoRef = React.useRef(null);
    
    // Effect to handle time setting when component mounts or props change
    React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const setVideoTime = () => {
            if (props.startTime !== undefined && video.readyState >= 2) {
                console.log(`Setting video time to ${props.startTime}s`);
                video.currentTime = props.startTime;
            }
        };
        
        // Try setting immediately if video is ready
        if (video.readyState >= 2) {
            setVideoTime();
        } else {
            // Wait for video to be ready
            video.addEventListener('loadeddata', setVideoTime);
            video.addEventListener('canplay', setVideoTime);
            
            return () => {
                video.removeEventListener('loadeddata', setVideoTime);
                video.removeEventListener('canplay', setVideoTime);
            };
        }
    }, [props.startTime, props.src]);
    
    const handleTimeUpdate = (e) => {
        // Handle end time looping for segments
        if (props.endTime && e.target.currentTime >= props.endTime) {
            e.target.currentTime = props.startTime || 0;
            e.target.pause();
        }
    };
    
    const handleSeeked = (e) => {
        console.log(`Video seeked to: ${e.target.currentTime.toFixed(1)}s (target: ${props.startTime}s)`);
    };
    
    return React.createElement('div', { className: 'video-player-container' },
        React.createElement('h3', { style: { color: 'white' } }, props.title),
        React.createElement('video', {
            ref: videoRef,
            src: props.src,
            controls: true,
            style: { width: '100%' },
            onTimeUpdate: handleTimeUpdate,
            onSeeked: handleSeeked,
            preload: 'metadata'
        })
    );
};