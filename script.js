document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('playBtn');
    const currentTimeSpan = document.getElementById('currentTime');
    const totalTimeSpan = document.getElementById('totalTime');
    const progressFill = document.getElementById('progressFill');
    const progressBar = document.getElementById('progressBar');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeRange = document.getElementById('volumeRange');
    const volumeSlider = document.getElementById('volumeSlider');
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    const playbackSpeed = document.getElementById('playbackSpeed');

    let isDragging = false;
    let lastTimeUpdate = 0;
    let isAudioEnded = false;
    let isResetting = false;

    // Play/Pause
    playBtn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePlay();
    });

    function togglePlay() {
        if (audio.paused) {
            // 音声が終了している場合は最初から再生
            if (isAudioEnded) {
                isResetting = true;
                audio.currentTime = 0;
                isAudioEnded = false;
                // プログレスバーを即座に更新
                updateProgressBar(0, audio.duration);
                currentTimeSpan.textContent = '0:00';
                // 短時間後にリセットフラグをクリア
                setTimeout(() => {
                    isResetting = false;
                }, 100);
            }
            audio.play().catch(handleAudioError);
        } else {
            audio.pause();
        }
    }
    
    function handleAudioError(error) {
        console.error('音声再生エラー:', error);
        // 再生ボタンの状態をリセット
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.setAttribute('aria-label', '再生');
    }

    // Audio events
    audio.addEventListener('loadedmetadata', () => {
        totalTimeSpan.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        if (isDragging || isResetting) return;
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        if (!duration || isNaN(duration) || duration <= 0) return;

        if (Math.abs(currentTime - lastTimeUpdate) >= 0.5) {
            currentTimeSpan.textContent = formatTime(currentTime);
            lastTimeUpdate = currentTime;
        }
        updateProgressBar(currentTime, duration);
    });

    audio.addEventListener('play', () => {
        isAudioEnded = false;
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        playBtn.setAttribute('aria-label', '一時停止');
    });

    audio.addEventListener('pause', () => {
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.setAttribute('aria-label', '再生');
    });

    audio.addEventListener('ended', () => {
        isAudioEnded = true;
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.setAttribute('aria-label', '再生');
    });
    
    audio.addEventListener('volumechange', () => {
        updateVolumeIcon();
        updateVolumeSlider();
    });
    
    audio.addEventListener('error', (e) => {
        console.error('音声ファイル読み込みエラー:', e);
        currentTimeSpan.textContent = 'エラー';
        totalTimeSpan.textContent = 'エラー';
    });
    
    audio.addEventListener('seeked', () => {
        // シーク操作が完了したらリセットフラグをクリア
        if (isResetting) {
            isResetting = false;
        }
    });

    // Progress bar
    let progressBarRect = null;
    let isPointerDown = false;
    
    const updateProgressBarRect = () => { 
        progressBarRect = progressBar.getBoundingClientRect(); 
    };
    
    window.addEventListener('resize', updateProgressBarRect);
    updateProgressBarRect();

    const getClientX = (e) => {
        if (e.type.includes('touch')) {
            const touch = e.touches && e.touches[0] ? e.touches[0] : 
                         e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : null;
            return touch ? touch.clientX : null;
        }
        return e.clientX;
    };

    const startDragging = (e) => {
        if (isPointerDown) return; // 重複防止
        
        e.preventDefault();
        isPointerDown = true;
        isDragging = true;
        initializeAudioForMobile();
        updateProgressBarRect();
        
        // イベントタイプに応じてリスナーを追加
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDragging);
        } else if (e.type === 'touchstart') {
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', stopDragging);
            document.addEventListener('touchcancel', stopDragging);
        }
        
        updateProgress(e);
    };

    const drag = (e) => {
        if (!isDragging || !isPointerDown) return;
        e.preventDefault();
        updateProgressVisual(e);
    };

    const stopDragging = (e) => {
        if (!isPointerDown) return;
        
        e.preventDefault();
        
        // 最終的な位置で音声の時刻を設定
        const rect = progressBarRect || progressBar.getBoundingClientRect();
        const clientX = getClientX(e);
        
        if (clientX !== null) {
            const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const duration = audio.duration;
            
            if (duration && !isNaN(duration) && duration > 0) {
                const newTime = (clickX / rect.width) * duration;
                const clampedTime = Math.max(0, Math.min(newTime, duration));
                audio.currentTime = clampedTime;
            }
        }
        
        isPointerDown = false;
        isDragging = false;
        
        // 全てのイベントリスナーを削除
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('touchend', stopDragging);
        document.removeEventListener('touchcancel', stopDragging);
    };

    const updateProgress = (e) => {
        const rect = progressBarRect || progressBar.getBoundingClientRect();
        const clientX = getClientX(e);
        
        if (clientX === null) return;
        
        const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const duration = audio.duration;
        
        if (!duration || isNaN(duration) || duration <= 0) return;
        
        const newTime = (clickX / rect.width) * duration;
        const clampedTime = Math.max(0, Math.min(newTime, duration));
        
        // ユーザーが手動で位置を変更した場合は終了状態をリセット
        isAudioEnded = false;
        
        // 音声の現在時刻を設定
        audio.currentTime = clampedTime;
        
        // ドラッグ中の視覚的フィードバック
        updateProgressBar(clampedTime, duration);
        currentTimeSpan.textContent = formatTime(clampedTime);
    };
    
    const updateProgressVisual = (e) => {
        const rect = progressBarRect || progressBar.getBoundingClientRect();
        const clientX = getClientX(e);
        
        if (clientX === null) return;
        
        const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const duration = audio.duration;
        
        if (!duration || isNaN(duration) || duration <= 0) return;
        
        const newTime = (clickX / rect.width) * duration;
        const clampedTime = Math.max(0, Math.min(newTime, duration));
        
        // ドラッグ中は視覚的な更新のみ
        updateProgressBar(clampedTime, duration);
        currentTimeSpan.textContent = formatTime(clampedTime);
    };
    
    const updateProgressBar = (currentTime, duration) => {
        const progress = (currentTime / duration) * 100;
        progressFill.style.width = `${Math.max(0, Math.min(progress, 100))}%`;
        progressBar.setAttribute('aria-valuenow', Math.round(progress));
    };

    progressBar.addEventListener('mousedown', startDragging);
    progressBar.addEventListener('touchstart', startDragging, { passive: false });

    // Volume controls
    const volumeControl = document.querySelector('.volume-control');
    volumeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMute();
    });
    
    // デスクトップのみでホバー機能を有効化
    function isMobileDevice() {
        return window.innerWidth <= 480 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    if (!isMobileDevice()) {
        volumeControl.addEventListener('mouseenter', () => volumeSlider.classList.add('show'));
        volumeControl.addEventListener('mouseleave', () => volumeSlider.classList.remove('show'));
    }

    function toggleMute() {
        audio.muted = !audio.muted;
    }

    volumeRange.addEventListener('input', function() {
        setVolume(this.value / 100);
    });

    function setVolume(volume) {
        if (safeSetVolume(audio, volume) && volume > 0) {
            audio.muted = false;
        }
    }

    function safeSetVolume(audioEl, vol) {
        try {
            audioEl.volume = vol;
            return true;
        } catch (error) {
            const vc = document.querySelector('.volume-control');
            if (vc) vc.classList.add('hidden');
            return false;
        }
    }
    
    function updateVolumeSlider() {
        volumeRange.value = audio.muted ? 0 : audio.volume * 100;
    }

    const VOLUME_ICONS = {
        muted: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
        low: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
        high: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
    };

    function updateVolumeIcon() {
        const { volume, muted } = audio;
        let iconType;
        if (muted || volume === 0) {
            iconType = 'muted';
        } else if (volume < 0.5) {
            iconType = 'low';
        } else {
            iconType = 'high';
        }
        volumeBtn.innerHTML = VOLUME_ICONS[iconType];
        
        // モバイル用のラベル
        if (isMobileDevice()) {
            const mobileLabels = {
                muted: 'ミュート中 - タップで音声をオンにする',
                low: 'タップでミュート/オン切り替え',
                high: 'タップでミュート/オン切り替え'
            };
            volumeBtn.setAttribute('aria-label', mobileLabels[iconType]);
        } else {
            const labels = {
                muted: 'ミュート中 - クリックで音量を復元',
                low: `音量: ${Math.round(volume * 100)}% - クリックでミュート`,
                high: `音量: ${Math.round(volume * 100)}% - クリックでミュート`
            };
            volumeBtn.setAttribute('aria-label', labels[iconType]);
        }
    }

    // Menu
    menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = menuDropdown.classList.toggle('show');
        menuBtn.setAttribute('aria-expanded', isOpen.toString());
    });

    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    playbackSpeed.addEventListener('change', function() {
        audio.playbackRate = parseFloat(this.value);
    });

    // Time formatting
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Keyboard accessibility
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        switch(e.code) {
            case 'Space':
            case 'Enter':
                if (document.activeElement === playBtn || document.activeElement === document.body) {
                    e.preventDefault();
                    togglePlay();
                }
                break;
            case 'ArrowLeft': e.preventDefault(); skipTime(-10); break;
            case 'ArrowRight': e.preventDefault(); skipTime(10); break;
            case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); break;
            case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); break;
            case 'KeyM': e.preventDefault(); toggleMute(); break;
        }
    });

    function skipTime(seconds) {
        if (audio.duration) {
            audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration));
        }
    }

    function adjustVolume(delta) {
        const newVolume = Math.max(0, Math.min(audio.volume + delta, 1));
        setVolume(newVolume);
    }

    // Mobile optimization
    let audioInitialized = false;
    function initializeAudioForMobile() {
        if (audioInitialized) return;
        try {
            if (audio.readyState < 1) audio.load();
            safeSetVolume(audio, audio.volume);
            audioInitialized = true;
        } catch (error) {
            audioInitialized = true; 
        }
    }

    const initOnce = () => {
        initializeAudioForMobile();
        document.removeEventListener('touchstart', initOnce);
        document.removeEventListener('click', initOnce);
    };
    document.addEventListener('touchstart', initOnce, { once: true, passive: true });
    document.addEventListener('click', initOnce, { once: true });
    
    // Initial state setup
    updateVolumeIcon();
    updateVolumeSlider();
});
