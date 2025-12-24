/**
 * أداة عرض فيديوهات يوتيوب - الإصدار الخارجي
 * يتم استضافة هذا الملف على GitHub
 * 
 * طريقة الاستخدام: أضف الكود التالي في بلوجر:
 * <div id="youtube-widget-container" data-channel-id="معرف_القناة"></div>
 * <script src="رابط_الملف_من_GitHub"></script>
 */

(function() {
    'use strict';

    // التحقق من وجود jQuery لتجنب التعارض
    if (typeof jQuery !== 'undefined') {
        jQuery.noConflict();
    }

    // ==== الإعدادات الافتراضية ====
    const DEFAULT_CONFIG = {
        CHANNEL_ID: 'UCyG546bXfZj2J4_EJMdvxqA',
        MAX_FETCH_COUNT: 12,
        INITIAL_DISPLAY_COUNT: 6,
        VIDEOS_PER_CLICK: 2,
        CACHE_DURATION: 5 * 60 * 1000,
        CORS_PROXY: 'https://api.allorigins.win/get?url='
    };

    // ==== أنماط CSS المضمنة ====
    function getStyles() {
        return `
        <style>
            /* -------------------------------------- */
            /* التنسيقات العامة */
            /* -------------------------------------- */
            .yt-widget-container {
                position: relative;
                padding: 15px;
                border-radius: 8px;
                background: #ffffff;
                margin-top: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                font-family: inherit;
                color: inherit;
                max-width: 100%;
                overflow: hidden;
            }

            .yt-widget-container::before {
                border-radius: 70px 0 0 0;
                bottom: 0;
                right: 0;
                content: '';
                width: 70px;
                height: 70px;
                position: absolute;
                background: rgba(0, 0, 0, .04);
            }

            .yt-widget-container * {
                box-sizing: border-box;
            }

            .yt-widget {
                max-width: 100%;
                font-family: inherit, sans-serif;
                color: #334155;
                background: transparent;
                padding: 0;
            }

            /* ===== العنوان ===== */
            .yt-widget-title {
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 15px 0;
                padding: 0;
                color: #1e293b;
                text-align: center;
            }

            /* ===== واجهة الانتظار المحسنة ===== */
            .yt-state-message {
                text-align: center;
                padding: 40px 20px;
                min-height: 150px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                font-size: 11px;
                border-radius: 6px;
                margin: 20px 0;
            }

            .yt-state-message.error {
                background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                border: 1px solid #fca5a5;
            }

            .yt-spinner {
                border: 3px solid #e2e8f0;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: yt-spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes yt-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* ===== أزرار التخطيط المصغرة ===== */
            .yt-layout-selector {
                display: flex;
                gap: 4px;
                margin-bottom: 20px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .yt-layout-btn {
                background: #e2e8f0;
                border: none;
                color: #334155;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 9px;
                font-weight: 500;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .yt-layout-btn:hover {
                background: #3b82f6;
                color: #ffffff;
                transform: translateY(-1px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .yt-layout-btn.active {
                background: #3b82f6;
                color: #ffffff;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .yt-layout-btn svg {
                width: 14px;
                height: 14px;
                stroke: currentColor;
                fill: none;
            }

            /* ===== الشبكة المحسنة ===== */
            .yt-videos-grid-container {
                margin-top: 10px;
            }

            .yt-videos-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                grid-auto-rows: minmax(220px, auto);
            }

            /* تخطيط العمودين */
            .yt-videos-grid-container.layout-two-cols .yt-videos-grid {
                grid-template-columns: repeat(2, 1fr);
                grid-auto-rows: minmax(220px, auto);
            }

            /* تخطيط القائمة المصغرة */
            .yt-videos-grid-container.layout-list .yt-videos-grid {
                grid-template-columns: 1fr;
                grid-auto-rows: minmax(80px, auto);
                gap: 12px;
            }

            .yt-videos-grid-container.layout-list .yt-video-card {
                flex-direction: row;
                height: 100px;
                min-height: 60px;
                border: none;
                align-items: stretch;
            }

            .yt-videos-grid-container.layout-list .yt-thumbnail-wrapper {
                width: 100px;
                height: 100px;
                flex-shrink: 0;
                border-radius: 6px;
            }

            .yt-videos-grid-container.layout-list .yt-video-info {
                padding: 8px 12px;
                flex-grow: 1;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                margin-right: 10px;
            }

            .yt-videos-grid-container.layout-list .yt-video-title {
                font-size: 11px;
                line-height: 1.4;
                max-height: 2.8em;
                margin: 0;
            }

            .yt-videos-grid-container.layout-list .yt-video-date {
                font-size: 9px;
                margin-top: 6px;
            }

            /* ===== بطاقة الفيديو المحسنة ===== */
            .yt-video-card {
                background: transparent;
                border: none;
                border-radius: 0;
                overflow: visible;
                box-shadow: none;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 200px;
                text-decoration: none !important;
                color: inherit;
                position: relative;
            }

            .yt-video-card:hover {
                transform: translateY(-3px);
            }

            /* إطار الصورة المصغرة */
            .yt-thumbnail-wrapper {
                width: 100%;
                aspect-ratio: 16 / 9;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
                border-radius: 0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                margin-bottom: 10px;
            }

            .yt-thumbnail-wrapper::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    to bottom,
                    rgba(0, 0, 0, 0.3) 0%,
                    transparent 20%,
                    transparent 80%,
                    rgba(0, 0, 0, 0.3) 100%
                );
                z-index: 1;
                pointer-events: none;
                border-radius: 0;
            }

            /* شارة الشورتس */
            .yt-shorts-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                background: #3b82f6;
                color: white;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 4px;
                border-radius: 2px;
                z-index: 2;
                text-transform: uppercase;
            }

            /* تنسيق خاص بالشورتس */
            .yt-video-card.is-short .yt-thumbnail-wrapper {
                aspect-ratio: 9 / 16;
            }

            .yt-video-card.is-short::after {
                content: 'SHORTS';
                position: absolute;
                top: 8px;
                right: 8px;
                background: #3b82f6;
                color: white;
                font-size: 7px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 2px;
                z-index: 3;
                text-transform: uppercase;
            }

            .yt-thumbnail-wrapper img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
                border-radius: 0;
            }

            .yt-video-card:hover .yt-thumbnail-wrapper img {
                transform: scale(1.05);
            }

            /* ===== أيقونة التشغيل ===== */
            .yt-play-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.9;
                transition: all 0.3s ease;
                z-index: 2;
            }

            .yt-video-card:hover .yt-play-icon {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.1);
            }

            .yt-play-icon svg {
                width: 30px;
                height: 30px;
                fill: #3b82f6;
                stroke: #3b82f6;
                stroke-width: 1.5;
                transition: all 0.3s ease;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            .yt-video-card:hover .yt-play-icon {
                transform: translate(-50%, -50%) scale(1.2);
                filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
            }

            /* ===== إطار المعلومات المنفصل ===== */
            .yt-video-info {
                padding: 2px 4px;
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                justify-content: space-between;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: all 0.1s ease;
            }

            .yt-video-card:hover .yt-video-info {
                border-color: #3b82f6;
                box-shadow: 0 4px 12px rgba(14, 165, 164, 0.15);
            }

            .yt-video-title {
                color: #1e293b;
                margin: 0;
                font-size: 9px;
                line-height: 1.4;
                max-height: 2.8em;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                font-weight: 600;
                text-align: right;
            }

            .yt-video-date {
                margin-top: 7px;
                font-size: 8px;
                color: #334155;
                opacity: 0.7;
                display: flex;
                align-items: center;
                gap: 4px;
                justify-content: flex-end;
            }

            .yt-video-date::before {
                content: "📅";
                margin-left: 4px;
                font-size: 7px;
            }

            /* ===== أزرار التحكم المحسنة ===== */
            .yt-actions-bar {
                display: flex;
                gap: 10px;
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                justify-content: center;
                flex-wrap: nowrap;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            .yt-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
                color: #ffffff;
                font-size: 11px;
                border-radius: 4px;
                transition: all 0.3s ease;
                text-decoration: none !important;
                cursor: pointer;
                flex-shrink: 0;
                gap: 6px;
                font-weight: 500;
                border: none;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .yt-button svg {
                width: 14px;
                height: 14px;
                stroke: currentColor;
                fill: none;
            }

            .yt-button-primary {
                background: #3b82f6;
                color: #ffffff;
                border-radius: 4px;
                border: none;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .yt-button-primary:hover {
                background: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            #reset-btn {
                background: #e2e8f0;
                color: #334155;
                border-radius: 4px;
            }

            #reset-btn:hover {
                background: #d1d5db;
                color: #ef4444;
            }

            #reset-btn.visible,
            #watch-more-btn.visible {
                opacity: 1;
                pointer-events: auto;
                display: inline-flex !important;
            }

            #watch-more-btn {
                opacity: 0;
                pointer-events: none;
            }

            /* ===== المشغل المنبثق ===== */
            .yt-video-modal {
                display: none;
                position: fixed;
                z-index: 9999;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(10px);
                padding: 20px;
            }

            .yt-modal-content {
                position: relative;
                background-color: #000000;
                margin: 3% auto;
                border-radius: 8px;
                width: 95%;
                max-width: 1000px;
                overflow: hidden;
            }

            .yt-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 40px;
                height: 40px;
                background: #e2e8f0;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .yt-modal-close:hover {
                background: rgba(239, 68, 68, 0.9);
                transform: rotate(90deg);
            }

            .yt-modal-close svg {
                width: 20px;
                height: 20px;
                stroke: #334155;
            }

            .yt-modal-close:hover svg {
                stroke: #ffffff;
            }

            .yt-modal-player-container {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
            }

            .yt-modal-player-container iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            /* ===== المشغل المصغر ===== */
            #yt-mini-player {
                display: none;
                position: fixed;
                bottom: 30px;
                left: 30px;
                width: 300px;
                height: 169px;
                z-index: 9998;
                background-color: #3b82f6;
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }

            #yt-mini-player.active {
                display: block;
            }

            #yt-mini-player.small-size {
                width: 240px;
                height: 135px;
            }

            .mini-player-controls {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 34px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #e2e8f0;
                padding: 0 8px;
                z-index: 10000;
            }

            #yt-mini-drag-handle {
                color: #334155;
                cursor: move;
                font-size: 11px;
                opacity: 0.9;
                display: flex;
                align-items: center;
                gap: 4px;
                font-weight: bold;
            }

            #yt-mini-drag-handle svg {
                width: 14px;
                height: 14px;
                stroke: #334155;
            }

            .mini-controls-group {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .mini-size-btn,
            #yt-mini-close-btn {
                background: #ffffff;
                color: #334155;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                padding: 2px 6px;
                cursor: pointer;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .mini-size-btn:hover {
                background: #3b82f6;
                color: #ffffff;
            }

            #yt-mini-close-btn:hover {
                background: #ef4444;
                color: #ffffff;
            }

            .mini-size-btn svg,
            #yt-mini-close-btn svg {
                width: 14px;
                height: 14px;
                stroke: currentColor;
                fill: none;
            }

            #yt-mini-player-iframe-container {
                position: absolute;
                top: 34px;
                left: 0;
                width: 100%;
                height: calc(100% - 34px);
            }

            #yt-mini-player iframe {
                width: 100%;
                height: 100%;
                border: none;
            }

            /* ===== استجابة للشاشات الصغيرة ===== */
            @media (max-width: 768px) {
                .yt-layout-selector {
                    flex-wrap: wrap;
                }

                .yt-actions-bar {
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    justify-content: flex-start;
                    padding-bottom: 5px;
                }

                .yt-button {
                    padding: 6px 12px;
                    font-size: 10px;
                    min-width: fit-content;
                }

                #yt-mini-player {
                    width: 250px;
                    height: 140.625px;
                    bottom: 20px;
                    left: 20px;
                }

                .yt-videos-grid-container.layout-list .yt-video-title {
                    font-size: 11px;
                }
            }

            @media (max-width: 480px) {
                .yt-videos-grid {
                    grid-template-columns: 1fr;
                    grid-auto-rows: minmax(150px, auto);
                    gap: 10px;
                }

                .yt-actions-bar {
                    gap: 8px;
                }

                .yt-button {
                    padding: 5px 10px;
                    font-size: 9px;
                }

                .yt-button svg {
                    width: 12px;
                    height: 12px;
                }

                #yt-mini-player {
                    width: 200px;
                    height: 112.5px;
                    bottom: 15px;
                    left: 15px;
                }

                .yt-videos-grid-container.layout-list .yt-video-title {
                    font-size: 9px;
                }
            }

            .yt-videos-grid {
                align-items: stretch;
            }

            .yt-video-card {
                align-self: stretch;
            }
        </style>
        `;
    }

    // ==== قالب HTML للأداة ====
    function getWidgetHTML() {
        return `
        <div class="yt-widget">
            <p class="yt-widget-title">أحدث الفيديوهات</p>

            <!-- أزرار التخطيط -->
            <div class="yt-layout-selector" id="yt-layout-selector">
                <button class="yt-layout-btn active" data-layout="default" title="تخطيط ثلاث أعمدة">
                    <svg class='line' viewbox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
                        <path d='M5 10H7C9 10 10 9 10 7V5C10 3 9 2 7 2H5C3 2 2 3 2 5V7C2 9 3 10 5 10Z' stroke-miterlimit='10'></path>
                        <path d='M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z' stroke-miterlimit='10'></path>
                        <path d='M17 22H19C21 22 22 21 22 19V17C22 15 21 14 19 14H17C15 14 14 15 14 17V19C14 21 15 22 17 22Z' stroke-miterlimit='10'></path>
                        <path d='M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z' stroke-miterlimit='10'></path>
                    </svg>
                    3 أعمدة
                </button>
                <button class="yt-layout-btn" data-layout="layout-two-cols" title="تخطيط عمودين">
                    <svg class='line' viewbox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
                        <path d='M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z'></path>
                        <path d='M12 2V22'></path>
                    </svg>
                    عمودين
                </button>
                <button class="yt-layout-btn" data-layout="layout-list" title="قائمة مصغرة">
                    <svg class='line' viewbox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
                        <path d='M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z'></path>
                        <path d='M9 2V22'></path>
                    </svg>
                    مصغر
                </button>
            </div>

            <!-- حاوية الفيديوهات -->
            <div id="youtube-content" class="yt-videos-grid-container"></div>

            <!-- أزرار التحكم -->
            <div class="yt-actions-bar">
                <button id="reset-btn" class="yt-button" style="display: none;">
                    <svg class='line' viewbox='0 0 24 24'><path d='M22 12C22 17.52 17.52 22 12 22C6.48 22 3.11 16.44 3.11 16.44M3.11 16.44H7.63M3.11 16.44V21.44M2 12C2 6.48 6.44 2 12 2C18.67 2 22 7.56 22 7.56M22 7.56V2.56M22 7.56H17.56'></path></svg>
                    إعادة تعيين
                </button>
                <a id="watch-more-btn" href="#" target="_blank" class="yt-button yt-button-primary">
                    <svg class='line' viewbox='0 0 24 24'><path d='M18.0699 14.4299L11.9999 20.4999L5.92993 14.4299' stroke-miterlimit='10'></path><path d='M12 3.5V20.33' stroke-miterlimit='10'></path></svg>
                    مشاهدة المزيد
                </a>
                <a id="view-channel-btn" href="#" target="_blank" class="yt-button yt-button-primary">
                    <svg class='line' viewbox='0 0 24 24'><path d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12' stroke-miterlimit='10'></path><path d='M13 11L21.2 2.80005'></path><path d='M21.9999 6.83V2H17.1699'></path></svg>
                    زيارة القناة
                </a>
            </div>
        </div>

        <!-- المشغل المنبثق -->
        <div id="video-modal" class="yt-video-modal">
            <div class="yt-modal-content">
                <button class="yt-modal-close" title="إغلاق">
                    <svg viewbox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
                        <line x1='18' y1='6' x2='6' y2='18'></line>
                        <line x1='6' y1='6' x2='18' y2='18'></line>
                    </svg>
                </button>
                <div id="yt-modal-player-container" class="yt-modal-player-container"></div>
            </div>
        </div>

        <!-- المشغل المصغر -->
        <div id="yt-mini-player">
            <div class="mini-player-controls">
                <div class="mini-controls-group">
                    <button id="yt-mini-zoom-out" class="mini-size-btn" title="تصغير">
                        <svg class='line' viewbox='0 0 24 24'><path d='M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z'></path><path d='M18 6L6 18'></path><path d='M18 10V6H14'></path><path d='M6 14V18H10'></path></svg>
                    </button>
                    <button id="yt-mini-zoom-in" class="mini-size-btn" title="تكبير">
                        <svg class='line' viewbox='0 0 24 24'><path d='M21 9V3H15'></path><path d='M3 15V21H9'></path><path d='M21 3L13.5 10.5'></path><path d='M10.5 13.5L3 21'></path></svg>
                    </button>
                </div>
                <div id="yt-mini-drag-handle" title="اسحب لتحريك المشغل">
                    <svg class='line' viewbox='0 0 24 24'><path d='M2 9V6.5C2 4.01 4.01 2 6.5 2H9'></path><path d='M15 2H17.5C19.99 2 22 4.01 22 6.5V9'></path><path d='M22 16V17.5C22 19.99 19.99 22 17.5 22H16'></path><path d='M9 22H6.5C4.01 22 2 19.99 2 17.5V15'></path></svg>
                </div>
                <div class="mini-controls-group">
                    <button id="yt-mini-close-btn" title="إغلاق">
                        <svg class='line' viewbox='0 0 24 24'><path d='M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z'></path><path d='M9.16998 14.83L14.83 9.17004'></path><path d='M14.83 14.83L9.16998 9.17004'></path></svg>
                    </button>
                </div>
            </div>
            <div id="yt-mini-player-iframe-container"></div>
        </div>
        `;
    }

    // ==== دوال مساعدة ====
    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const intervals = [
            { label: 'سنة', seconds: 31536000 },
            { label: 'شهر', seconds: 2592000 },
            { label: 'أسبوع', seconds: 604800 },
            { label: 'يوم', seconds: 86400 },
            { label: 'ساعة', seconds: 3600 },
            { label: 'دقيقة', seconds: 60 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return 'قبل ' + count + ' ' + interval.label + (count > 1 && !['ساعة', 'دقيقة'].includes(interval.label) ? 'ات' : '');
            }
        }
        return 'الآن';
    }

    function getVideoId(link) {
        const match = link.match(/(?:v=|\/shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    function isShorts(link) {
        return link.includes('/shorts/');
    }

    function getCache() {
        try {
            const cached = localStorage.getItem('yt-widget-cache');
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp > DEFAULT_CONFIG.CACHE_DURATION) {
                localStorage.removeItem('yt-widget-cache');
                return null;
            }
            return parsed.data;
        } catch (e) { return null; }
    }

    function setCache(data) {
        try {
            localStorage.setItem('yt-widget-cache', JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }

    // ==== الكلاس الرئيسي ====
    class YouTubeWidget {
        constructor(containerId, config = {}) {
            this.containerId = containerId;
            this.config = Object.assign({}, DEFAULT_CONFIG, config);
            this.allFetchedVideos = [];
            this.currentlyDisplayedCount = 0;
            this.cache = null;
            this.isLoading = false;
            this.currentVideoId = null;
            this.isDragging = false;
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.initialLeft = 0;
            this.initialBottom = 0;

            this.CHANNEL_URL = 'https://www.youtube.com/channel/' + this.config.CHANNEL_ID;
            this.RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + this.config.CHANNEL_ID;

            this.init();
        }

        init() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error('لم يتم العثور على الحاوية: ' + this.containerId);
                return;
            }

            // إضافة الأنماط والقالب
            container.innerHTML = getStyles() + getWidgetHTML();

            // الحصول على عناصر DOM
            this.elements = {
                content: container.querySelector('#youtube-content'),
                modal: container.querySelector('#video-modal'),
                modalPlayer: container.querySelector('#yt-modal-player-container'),
                closeBtn: container.querySelector('.yt-modal-close'),
                miniPlayer: container.querySelector('#yt-mini-player'),
                miniContainer: container.querySelector('#yt-mini-player-iframe-container'),
                dragHandle: container.querySelector('#yt-mini-drag-handle'),
                watchMore: container.querySelector('#watch-more-btn'),
                viewChannel: container.querySelector('#view-channel-btn'),
                resetBtn: container.querySelector('#reset-btn'),
                zoomOut: container.querySelector('#yt-mini-zoom-out'),
                zoomIn: container.querySelector('#yt-mini-zoom-in'),
                miniClose: container.querySelector('#yt-mini-close-btn'),
                layoutSelector: container.querySelector('#yt-layout-selector')
            };

            this.elements.layoutBtns = container.querySelectorAll('.yt-layout-btn');

            // تهيئة رابط القناة
            this.elements.viewChannel.href = this.CHANNEL_URL;

            // ربط الأحداث
            this.bindEvents();

            // بدء تحميل الفيديوهات
            this.loadVideos();
        }

        bindEvents() {
            const self = this;

            // أزرار التخطيط
            this.elements.layoutSelector.addEventListener('click', function(e) {
                const btn = e.target.closest('.yt-layout-btn');
                if (!btn) return;

                self.elements.layoutBtns.forEach(function(b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                const layout = btn.getAttribute('data-layout');
                self.elements.content.classList.remove('layout-list', 'layout-two-cols');
                if (layout !== 'default') {
                    self.elements.content.classList.add(layout);
                }
            });

            // أزرار التحكم
            this.elements.watchMore.addEventListener('click', function(e) {
                e.preventDefault();
                self.addMoreVideos();
            });

            this.elements.resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.resetVideos();
            });

            this.elements.closeBtn.addEventListener('click', function() {
                self.minimizePlayer();
            });

            this.elements.miniClose.addEventListener('click', function() {
                self.stopMini();
            });

            // إغلاق النافذة بالنقر خارجها
            this.elements.modal.addEventListener('click', function(e) {
                if (e.target === self.elements.modal) {
                    self.minimizePlayer();
                }
            });

            // مفتاح ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (self.elements.miniPlayer.classList.contains('active')) {
                        self.stopMini();
                    } else if (self.elements.modal.style.display === 'block') {
                        self.minimizePlayer();
                    }
                }
            });

            // التحكم بالحجم
            this.elements.zoomOut.onclick = function() {
                self.elements.miniPlayer.classList.add('small-size');
                self.elements.zoomOut.style.display = 'none';
                self.elements.zoomIn.style.display = 'block';
            };

            this.elements.zoomIn.onclick = function() {
                self.elements.miniPlayer.classList.remove('small-size');
                self.elements.zoomIn.style.display = 'none';
                self.elements.zoomOut.style.display = 'block';
            };

            this.elements.zoomIn.style.display = 'none';

            // ربط أحداث السحب
            this.elements.dragHandle.addEventListener('mousedown', function(e) {
                self.dragStart(e);
            });
            this.elements.dragHandle.addEventListener('touchstart', function(e) {
                self.dragStart(e);
            });
            document.addEventListener('mouseup', function() {
                self.dragEnd();
            });
            document.addEventListener('touchend', function() {
                self.dragEnd();
            });
            document.addEventListener('mousemove', function(e) {
                self.drag(e);
            });
            document.addEventListener('touchmove', function(e) {
                self.drag(e);
            });
        }

        dragStart(e) {
            this.isDragging = true;
            e.preventDefault();
            this.elements.miniPlayer.classList.add('is-dragging');

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            this.dragStartX = clientX;
            this.dragStartY = clientY;

            this.initialLeft = parseFloat(this.elements.miniPlayer.style.left) || 0;
            this.initialBottom = parseFloat(this.elements.miniPlayer.style.bottom) || 0;
            this.elements.miniPlayer.style.transition = 'none';
        }

        dragEnd() {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.elements.miniPlayer.classList.remove('is-dragging');
            this.elements.miniPlayer.style.transition = 'all 0.4s ease';
        }

        drag(e) {
            if (!this.isDragging) return;

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            const dx = clientX - this.dragStartX;
            const dy = clientY - this.dragStartY;

            let newLeft = this.initialLeft + dx;
            let newBottom = this.initialBottom - dy;

            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const playerW = this.elements.miniPlayer.offsetWidth;
            const playerH = this.elements.miniPlayer.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, winW - playerW));
            newBottom = Math.max(0, Math.min(newBottom, winH - playerH));

            this.elements.miniPlayer.style.left = newLeft + 'px';
            this.elements.miniPlayer.style.bottom = newBottom + 'px';
        }

        // ==== إدارة الواجهة ====
        showLoading() {
            this.elements.content.innerHTML = '<div class="yt-state-message"><div class="yt-spinner"></div><p>جاري تحميل أحدث الفيديوهات...</p></div>';
        }

        showError(message, showRetry) {
            var retryBtn = showRetry ? '<button onclick="location.reload()" class="yt-button yt-button-primary">إعادة المحاولة</button>' : '';
            this.elements.content.innerHTML = '<div class="yt-state-message error"><p>' + message + '</p>' + retryBtn + '</div>';
        }

        // ==== تحميل الفيديوهات ====
        async fetchWithRetry(url, retries) {
            retries = retries || 3;
            for (var i = 0; i < retries; i++) {
                try {
                    var response = await fetch(url);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return await response.json();
                } catch (error) {
                    if (i === retries - 1) throw error;
                    await new Promise(function(resolve) {
                        setTimeout(resolve, 1000 * (i + 1));
                    });
                }
            }
        }

        async loadVideos(forceRefresh) {
            forceRefresh = forceRefresh || false;

            if (this.isLoading) return;

            // فحص التخزين المؤقت
            if (!forceRefresh) {
                this.cache = getCache();
                if (this.cache && this.cache.videos) {
                    this.allFetchedVideos = this.cache.videos;
                    this.showVideos(this.allFetchedVideos.slice(0, this.config.INITIAL_DISPLAY_COUNT));
                    this.currentlyDisplayedCount = this.config.INITIAL_DISPLAY_COUNT;
                    this.updateButtons();
                    return;
                }
            }

            this.isLoading = true;
            this.showLoading();

            try {
                var proxyUrl = this.config.CORS_PROXY + encodeURIComponent(this.RSS_URL);
                var data = await this.fetchWithRetry(proxyUrl);

                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(data.contents, 'text/xml');

                if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                    throw new Error('خطأ في تحليل البيانات');
                }

                var entries = xmlDoc.getElementsByTagName('entry');
                this.allFetchedVideos = [];

                for (var i = 0; i < Math.min(entries.length, this.config.MAX_FETCH_COUNT); i++) {
                    var entry = entries[i];
                    var title = entry.getElementsByTagName('title')[0] ? entry.getElementsByTagName('title')[0].textContent.trim() : 'بدون عنوان';
                    var link = entry.getElementsByTagName('link')[0] ? entry.getElementsByTagName('link')[0].getAttribute('href') : '';
                    var published = entry.getElementsByTagName('published')[0] ? entry.getElementsByTagName('published')[0].textContent : '';
                    var videoId = getVideoId(link);

                    if (videoId) {
                        var isShort = isShorts(link);
                        var thumbnail = isShort ? 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg' : 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg';

                        this.allFetchedVideos.push({
                            title: title,
                            videoId: videoId,
                            link: link,
                            published: published,
                            thumbnail: thumbnail,
                            isShort: isShort,
                            type: isShort ? 'shorts' : 'video'
                        });
                    }
                }

                if (this.allFetchedVideos.length === 0) {
                    this.showError('لم يتم العثور على فيديوهات في القناة.');
                    return;
                }

                setCache({ videos: this.allFetchedVideos });
                this.currentlyDisplayedCount = Math.min(this.config.INITIAL_DISPLAY_COUNT, this.allFetchedVideos.length);
                this.showVideos(this.allFetchedVideos.slice(0, this.currentlyDisplayedCount));
                this.updateButtons();

            } catch (error) {
                console.error('خطأ في تحميل الفيديوهات:', error);
                if (this.cache && this.cache.videos) {
                    this.showError('مشكلة في الاتصال، يتم عرض البيانات المحفوظة مؤقتاً.', false);
                    this.allFetchedVideos = this.cache.videos;
                    this.currentlyDisplayedCount = Math.min(this.config.INITIAL_DISPLAY_COUNT, this.allFetchedVideos.length);
                    this.showVideos(this.allFetchedVideos.slice(0, this.currentlyDisplayedCount));
                    this.updateButtons();
                } else {
                    this.showError('عذراً، حدث خطأ في تحميل الفيديوهات. تأكد من معرف القناة.');
                }
            } finally {
                this.isLoading = false;
            }
        }

        showVideos(videos) {
            var self = this;

            if (videos.length === 0) {
                this.showError('لم يتم العثور على فيديوهات لعرضها.');
                return;
            }

            var html = '<div class="yt-videos-grid">';
            videos.forEach(function(video) {
                var shortClass = video.isShort ? ' is-short' : '';
                var shortsBadge = video.isShort ? '<div class="yt-shorts-badge">SHORTS</div>' : '';

                html += '<div class="yt-video-card' + shortClass + '" data-video-id="' + video.videoId + '" data-link="' + video.link + '" data-video-type="' + video.type + '">' +
                    '<div class="yt-thumbnail-wrapper">' +
                    '<img src="' + video.thumbnail + '" alt="' + video.title + '" loading="lazy">' +
                    shortsBadge +
                    '<div class="yt-play-icon">' +
                    '<svg class="line" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11.9999V8.43989C4 4.01989 7.13 2.2099 10.96 4.4199L14.05 6.1999L17.14 7.9799C20.97 10.1899 20.97 13.8099 17.14 16.0199L14.05 17.7999L10.96 19.5799C7.13 21.7899 4 19.9799 4 15.5599V11.9999Z" stroke-miterlimit="10"></path></svg>' +
                    '</div>' +
                    '</div>' +
                    '<div class="yt-video-info">' +
                    '<h3 class="yt-video-title">' + video.title + '</h3>' +
                    '<span class="yt-video-date">' + timeAgo(video.published) + '</span>' +
                    '</div>' +
                    '</div>';
            });
            html += '</div>';
            this.elements.content.innerHTML = html;

            // ربط أحداث البطاقات
            var cards = this.elements.content.querySelectorAll('.yt-video-card');
            for (var c = 0; c < cards.length; c++) {
                (function(card) {
                    var videoId = card.getAttribute('data-video-id');
                    var link = card.getAttribute('data-link');

                    card.addEventListener('click', function(e) {
                        e.preventDefault();
                        card.style.transform = 'scale(0.95)';
                        setTimeout(function() {
                            card.style.transform = '';
                            self.openPlayer(videoId, link);
                        }, 150);
                    });

                    card.addEventListener('mouseenter', function() {
                        this.style.zIndex = '10';
                    });

                    card.addEventListener('mouseleave', function() {
                        this.style.zIndex = '';
                    });
                })(cards[c]);
            }
        }

        addMoreVideos() {
            var self = this;
            var nextIndex = this.currentlyDisplayedCount + this.config.VIDEOS_PER_CLICK;
            var newVideos = this.allFetchedVideos.slice(this.currentlyDisplayedCount, nextIndex);

            if (newVideos.length === 0) return;

            var html = '';
            newVideos.forEach(function(video) {
                var shortClass = video.isShort ? ' is-short' : '';
                var shortsBadge = video.isShort ? '<div class="yt-shorts-badge">SHORTS</div>' : '';

                html += '<div class="yt-video-card' + shortClass + '" data-video-id="' + video.videoId + '" data-link="' + video.link + '" data-video-type="' + video.type + '">' +
                    '<div class="yt-thumbnail-wrapper">' +
                    '<img src="' + video.thumbnail + '" alt="' + video.title + '" loading="lazy">' +
                    shortsBadge +
                    '<div class="yt-play-icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"></polygon></svg>' +
                    '</div>' +
                    '</div>' +
                    '<div class="yt-video-info">' +
                    '<h3 class="yt-video-title">' + video.title + '</h3>' +
                    '<span class="yt-video-date">' + timeAgo(video.published) + '</span>' +
                    '</div>' +
                    '</div>';
            });

            var grid = this.elements.content.querySelector('.yt-videos-grid');
            if (grid) grid.insertAdjacentHTML('beforeend', html);

            this.currentlyDisplayedCount += newVideos.length;
            this.updateButtons();

            // ربط أحداث البطاقات الجديدة
            var newCards = grid.querySelectorAll('.yt-video-card:nth-last-child(-n+' + newVideos.length + ')');
            for (var i = 0; i < newCards.length; i++) {
                (function(card) {
                    var videoId = card.getAttribute('data-video-id');
                    var link = card.getAttribute('data-link');

                    card.addEventListener('click', function(e) {
                        e.preventDefault();
                        card.style.transform = 'scale(0.95)';
                        setTimeout(function() {
                            card.style.transform = '';
                            self.openPlayer(videoId, link);
                        }, 150);
                    });
                })(newCards[i]);
            }
        }

        resetVideos() {
            var cards = this.elements.content.querySelectorAll('.yt-video-card');
            for (var i = 0; i < cards.length; i++) {
                if (i >= this.config.INITIAL_DISPLAY_COUNT) {
                    cards[i].remove();
                }
            }
            this.currentlyDisplayedCount = this.config.INITIAL_DISPLAY_COUNT;
            this.updateButtons();
        }

        updateButtons() {
            var hasMore = this.currentlyDisplayedCount < this.allFetchedVideos.length;
            var hasHidden = this.currentlyDisplayedCount > this.config.INITIAL_DISPLAY_COUNT;

            this.elements.resetBtn.classList.toggle('visible', hasHidden);
            this.elements.watchMore.classList.toggle('visible', hasMore);
        }

        // ==== إدارة المشغلات ====
        createIframe(videoId, isShort) {
            isShort = isShort || false;
            var params = new URLSearchParams({
                rel: '0',
                showinfo: '0',
                autoplay: '1',
                mute: '1',
                playsinline: '1'
            });

            if (isShort) {
                params.set('loop', '1');
                params.set('playlist', videoId);
            }

            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + videoId + '?' + params.toString();
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.frameBorder = '0';
            iframe.style.borderRadius = '0';
            return iframe;
        }

        openPlayer(videoId, link) {
            this.stopMini();
            this.currentVideoId = videoId;
            var isShort = isShorts(link);

            this.elements.modal.style.display = 'block';
            this.elements.modalPlayer.innerHTML = '';

            var iframe = this.createIframe(videoId, isShort);
            this.elements.modalPlayer.appendChild(iframe);
            document.body.style.overflow = 'hidden';
        }

        minimizePlayer() {
            if (!this.currentVideoId) return;

            this.elements.modal.style.display = 'none';
            this.elements.modalPlayer.innerHTML = '';

            var iframe = this.createIframe(this.currentVideoId);
            this.elements.miniContainer.innerHTML = '';
            this.elements.miniContainer.appendChild(iframe);
            this.elements.miniPlayer.classList.add('active');

            if (!this.elements.miniPlayer.style.left) {
                this.elements.miniPlayer.style.left = '30px';
                this.elements.miniPlayer.style.bottom = '30px';
            }

            document.body.style.overflow = '';
        }

        stopMini() {
            this.elements.miniPlayer.classList.remove('active');
            this.elements.miniContainer.innerHTML = '';
            this.currentVideoId = null;
            document.body.style.overflow = '';
        }
    }

    // ==== التهيئة التلقائية ====
    function initWidgets() {
        var containers = document.querySelectorAll('[data-channel-id]');

        containers.forEach(function(container) {
            var id = container.id;
            if (!id) {
                id = 'yt-widget-' + Math.random().toString(36).substr(2, 9);
                container.id = id;
            }

            var channelId = container.getAttribute('data-channel-id');

            var config = {
                CHANNEL_ID: channelId,
                MAX_FETCH_COUNT: parseInt(container.getAttribute('data-max-count')) || DEFAULT_CONFIG.MAX_FETCH_COUNT,
                INITIAL_DISPLAY_COUNT: parseInt(container.getAttribute('data-initial-count')) || DEFAULT_CONFIG.INITIAL_DISPLAY_COUNT,
                VIDEOS_PER_CLICK: parseInt(container.getAttribute('data-per-click')) || DEFAULT_CONFIG.VIDEOS_PER_CLICK,
                CACHE_DURATION: parseInt(container.getAttribute('data-cache-duration')) || DEFAULT_CONFIG.CACHE_DURATION
            };

            new YouTubeWidget(id, config);
        });
    }

    // ==== بدء التنفيذ ====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidgets);
    } else {
        initWidgets();
    }

    // تحديث دوري كل 10 دقائق
    setInterval(function() {
        var containers = document.querySelectorAll('[data-channel-id]');
        containers.forEach(function(container) {
            var widget = window[container.id + '_widget'];
            if (widget && !widget.isLoading) {
                widget.loadVideos(true);
            }
        });
    }, 10 * 60 * 1000);

})();
