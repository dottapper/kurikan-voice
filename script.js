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
    let previousVolume = 1.0; // ミュート前の音量を保存
    let isMuted = false; // ミュート状態を管理
    let lastTimeUpdate = 0; // timeupdate最適化用
    
    // 再生/一時停止ボタンのクリックイベント
    playBtn.addEventListener('click', function(e) {
        e.preventDefault();
        togglePlay();
    });
    
    // タッチイベント対応
    playBtn.addEventListener('touchstart', function(e) {
        // タッチハイライトを防ぐ
    });
    
    function togglePlay() {
        if (audio.paused) {
            audio.play().catch(function(error) {
                console.warn('再生エラー:', error);
                handleAudioError(error);
            });
        } else {
            audio.pause();
        }
    }
    

    
    // 音声のメタデータが読み込まれた時の処理
    audio.addEventListener('loadedmetadata', function() {
        const duration = audio.duration;
        totalTimeSpan.textContent = formatTime(duration);
    });
    
    // 音声の再生時間が更新された時の処理（最適化版・エラーハンドリング強化）
    audio.addEventListener('timeupdate', function() {
        if (!isDragging) {
            try {
                const currentTime = audio.currentTime || 0;
                const duration = audio.duration;
                
                // durationが有効な値かチェック
                if (!duration || isNaN(duration) || duration <= 0) {
                    return;
                }
                
                // 0.5秒ごとに更新してパフォーマンスを最適化
                if (Math.abs(currentTime - lastTimeUpdate) >= 0.5) {
                    if (currentTimeSpan) {
                        currentTimeSpan.textContent = formatTime(currentTime);
                    }
                    lastTimeUpdate = currentTime;
                }
                
                const progress = (currentTime / duration) * 100;
                if (progressFill && !isNaN(progress)) {
                    progressFill.style.width = progress + '%';
                }
            } catch (error) {
                console.warn('timeupdate処理エラー:', error);
            }
        }
    });
    
    // 音声イベントベースの状態管理
    audio.addEventListener('play', function() {
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        playBtn.setAttribute('aria-label', '一時停止');
    });
    
    audio.addEventListener('pause', function() {
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.setAttribute('aria-label', '再生');
    });
    
    // 音声が終了した時の処理
    audio.addEventListener('ended', function() {
        progressFill.style.width = '0%';
        currentTimeSpan.textContent = '0:00';
    });
    
    // プログレスバーのタッチ/マウスイベント（最適化版）
    progressBar.addEventListener('mousedown', startDragging);
    progressBar.addEventListener('touchstart', startDragging, { passive: false });
    
    // パフォーマンス向上のためのキャッシュ
    let progressBarRect = null;
    
    function updateProgressBarRect() {
        progressBarRect = progressBar.getBoundingClientRect();
    }
    
    // リサイズ時にキャッシュを更新
    window.addEventListener('resize', updateProgressBarRect);
    
    // 初期化時にキャッシュを設定
    updateProgressBarRect();
    
    function startDragging(e) {
        isDragging = true;
        initializeAudioForMobile(); // タッチ時に音声を初期化
        updateProgressBarRect(); // ドラッグ開始時にキャッシュを更新
        
        // ドラッグ中のみイベントリスナーを追加
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('touchend', stopDragging, { passive: true });
        
        updateProgress(e);
    }
    
    function drag(e) {
        if (isDragging) {
            updateProgress(e);
        }
    }
    
    function stopDragging() {
        isDragging = false;
        
        // ドラッグ終了時にイベントリスナーを削除
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('touchend', stopDragging);
    }
    
    function updateProgress(e) {
        e.preventDefault(); // タッチイベントのデフォルト動作を防ぐ
        
        // キャッシュされたrectを使用（パフォーマンス向上）
        const rect = progressBarRect || progressBar.getBoundingClientRect();
        let clientX;
        
        // タッチイベントの安全な処理（ユーティリティ関数使用）
        clientX = getTouchClientX(e);
        
        if (clientX === null) {
            console.warn('座標情報が取得できませんでした:', e.type);
            return;
        }
        
        const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const width = rect.width;
        const duration = audio.duration;
        
        if (duration > 0 && width > 0 && !isNaN(duration) && !isNaN(width)) {
            try {
                const newTime = (clickX / width) * duration;
                audio.currentTime = Math.max(0, Math.min(newTime, duration));
                
                const progress = (audio.currentTime / duration) * 100;
                if (progressFill) {
                    progressFill.style.width = progress + '%';
                }
                if (currentTimeSpan) {
                    currentTimeSpan.textContent = formatTime(audio.currentTime);
                }
                
                // アクセシビリティ用のaria属性更新
                if (progressBar) {
                    progressBar.setAttribute('aria-valuenow', Math.round(progress));
                }
            } catch (error) {
                console.warn('プログレス更新エラー:', error);
            }
        }
    }
    
    // ボリュームボタンのクリックイベント（ミュート機能）
    volumeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMute();
    });
    
    // ボリュームボタンにマウスオーバーでスライダー表示
    volumeBtn.addEventListener('mouseenter', function() {
        volumeSlider.classList.add('show');
    });
    
    // ボリュームスライダーにマウスが入った時も表示を維持
    volumeSlider.addEventListener('mouseenter', function() {
        volumeSlider.classList.add('show');
    });
    
    // ボリュームコントロール全体からマウスが離れた時のみスライダーを隠す
    const volumeControl = document.querySelector('.volume-control');
    volumeControl.addEventListener('mouseleave', function(e) {
        // マウスがボリュームコントロール全体から完全に離れた場合のみ隠す
        if (!volumeControl.contains(e.relatedTarget)) {
            volumeSlider.classList.remove('show');
        }
    });
    
    // ミュート機能の切り替え（安全性向上）
    function toggleMute() {
        if (isMuted) {
            // ミュート解除
            const success = safeSetVolume(audio, previousVolume);
            if (success) {
                volumeRange.value = previousVolume * 100;
                isMuted = false;
                updateVolumeIcon(previousVolume);
            }
        } else {
            // ミュート
            previousVolume = audio.volume;
            const success = safeSetVolume(audio, 0);
            if (success) {
                volumeRange.value = 0;
                isMuted = true;
                updateVolumeIcon(0);
            }
        }
    }
    
    // ボリュームスライダーの変更
    volumeRange.addEventListener('input', function() {
        const volume = this.value / 100;
        setVolume(volume);
    });
    
    // iOSでの音量制御エラーを安全に処理（ユーティリティ関数）
    function safeSetVolume(audio, volume) {
        try {
            audio.volume = volume;
            return true;
        } catch (error) {
            console.log('iOSではシステム音量で制御されます');
            // iOS では音量制御ができないため、スライダーを無効化
            if (volumeRange) {
                volumeRange.disabled = true;
                volumeRange.style.opacity = '0.5';
                volumeRange.title = 'この端末では音量調整はシステム設定で行ってください';
            }
            return false;
        }
    }

    // タッチイベントの安全な処理（ユーティリティ関数）
    function getTouchClientX(e) {
        if (e.type.includes('touch')) {
            let touches = null;
            
            // タッチイベントの種類に応じて適切なtouchesを取得
            if (e.type === 'touchstart' || e.type === 'touchmove') {
                touches = e.touches;
            } else if (e.type === 'touchend' || e.type === 'touchcancel') {
                touches = e.changedTouches;
            }
            
            // touchesの安全性チェック
            if (touches && touches.length > 0 && touches[0]) {
                const clientX = touches[0].clientX;
                // 座標値の有効性チェック
                if (typeof clientX === 'number' && !isNaN(clientX)) {
                    return clientX;
                }
            }
            return null; // タッチ情報が無効な場合
        }
        
        // マウスイベントの処理
        const clientX = e.clientX;
        if (typeof clientX === 'number' && !isNaN(clientX)) {
            return clientX;
        }
        return null; // マウス座標が無効な場合
    }

    // 音量設定の統一関数（安全性向上）
    function setVolume(volume) {
        const success = safeSetVolume(audio, volume);
        
        if (success) {
            // スライダーを動かしたらミュート状態を解除
            if (isMuted && volume > 0) {
                isMuted = false;
            }
        }
        
        updateVolumeIcon(volume);
        return success;
    }
    
    // ボリュームアイコンの定義（パフォーマンス向上）
    const VOLUME_ICONS = {
        muted: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
        low: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
        high: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
    };
    
    // ボリュームアイコンの更新（最適化版）
    function updateVolumeIcon(volume) {
        let iconType;
        if (volume === 0) {
            iconType = 'muted';
        } else if (volume < 0.5) {
            iconType = 'low';
        } else {
            iconType = 'high';
        }
        
        volumeBtn.innerHTML = VOLUME_ICONS[iconType];
        
        // アクセシビリティのためのラベル更新
        const labels = {
            muted: 'ミュート中 - クリックで音量を復元',
            low: `音量: ${Math.round(volume * 100)}% - クリックでミュート`,
            high: `音量: ${Math.round(volume * 100)}% - クリックでミュート`
        };
        volumeBtn.setAttribute('aria-label', labels[iconType]);
    }
    
    // メニューボタンのクリックイベント
    menuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const isOpen = menuDropdown.classList.toggle('show');
        menuBtn.setAttribute('aria-expanded', isOpen.toString());
    });
    
    // メニューやボリュームスライダー外をクリックした時に閉じる
    document.addEventListener('click', function(e) {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
            menuBtn.setAttribute('aria-expanded', 'false');
        }
        // ボリュームスライダーはマウスオーバーで制御するため、クリック時の自動非表示は削除
    });
    
    // 再生速度の変更
    playbackSpeed.addEventListener('change', function() {
        const speed = parseFloat(this.value);
        audio.playbackRate = speed;
    });
    
    // 時間をフォーマットする関数（最適化版）
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    // キーボードアクセシビリティ対応
    document.addEventListener('keydown', function(e) {
        // フォーカスが入力フィールドにある場合はショートカットを無効化
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') {
            return;
        }
        
        switch(e.code) {
            case 'Space':
            case 'Enter':
                if (e.target === playBtn || e.target === document.body) {
                    e.preventDefault();
                    togglePlay();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                skipTime(-10); // 10秒戻る
                break;
            case 'ArrowRight':
                e.preventDefault();
                skipTime(10); // 10秒進む
                break;
            case 'ArrowUp':
                e.preventDefault();
                adjustVolume(0.1); // 音量上げる
                break;
            case 'ArrowDown':
                e.preventDefault();
                adjustVolume(-0.1); // 音量下げる
                break;
            case 'KeyM':
                e.preventDefault();
                toggleMute();
                break;
        }
    });
    
    // 時間スキップ機能（エラーハンドリング強化）
    function skipTime(seconds) {
        try {
            if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                const currentTime = audio.currentTime || 0;
                const newTime = Math.max(0, Math.min(currentTime + seconds, audio.duration));
                audio.currentTime = newTime;
            }
        } catch (error) {
            console.warn('時間スキップエラー:', error);
        }
    }
    
    // 音量調整機能（エラーハンドリング強化）
    function adjustVolume(delta) {
        const newVolume = Math.max(0, Math.min(audio.volume + delta, 1));
        const success = setVolume(newVolume);
        
        if (success && volumeRange) {
            volumeRange.value = newVolume * 100;
        }
    }
    
    // 初期設定（安全な音量設定関数使用）
    const initialVolumeSuccess = safeSetVolume(audio, 1.0);
    updateVolumeIcon(1.0);
    
    if (!initialVolumeSuccess) {
        console.log('このデバイスでは音量はシステム設定で制御されます');
    }
    
    // モバイル用最適化
    let audioInitialized = false;
    
    // モバイルデバイスでの自動再生制限への対応（エラーハンドリング強化）
    function initializeAudioForMobile() {
        if (!audioInitialized) {
            try {
                if (audio && audio.readyState < 2) {
                    audio.load();
                }
                // iOSでの音量制御の問題を解決
                try {
                    audio.volume = 1.0;
                } catch (volumeError) {
                    // iOSではボリュームスライダーを非表示に
                    const volumeControl = document.querySelector('.volume-control');
                    if (volumeControl) {
                        volumeControl.classList.add('hidden');
                    }
                }
                audioInitialized = true;
            } catch (error) {
                // エラーが発生しても初期化フラグは立てることで、無限ループを防ぐ
                audioInitialized = true;
            }
        }
    }
    
    // 統合されたイベントリスナー（touchstartまたはclickのいずれかで初期化）
    const initializeAudio = (e) => {
        initializeAudioForMobile();
        document.removeEventListener('touchstart', initializeAudio);
        document.removeEventListener('click', initializeAudio);
    };
    
    document.addEventListener('touchstart', initializeAudio, { once: true, passive: true });
    document.addEventListener('click', initializeAudio, { once: true });
    
    // 絵本読み聞かせ用途に最適化されたエラーハンドリング
    audio.addEventListener('error', function(e) {
    });
    
    // 読み込み開始時の処理
    audio.addEventListener('loadstart', function() {
    });
    
    // ネットワークの問題で停止した場合
    audio.addEventListener('stalled', function() {
    });
    
    // 再生准備完了
    audio.addEventListener('canplaythrough', function() {
    });
});