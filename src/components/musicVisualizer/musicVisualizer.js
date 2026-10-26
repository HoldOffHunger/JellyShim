/**
 * JellyShim: MilkDrop-style music visualizer (Butterchurn) drawn behind the
 * Now Playing screen. Off unless turned on in Playback settings.
 * @module components/musicVisualizer/musicVisualizer
 */

import { playbackManager } from '../playback/playbackmanager';
import * as userSettings from '../../scripts/settings/userSettings';

import './musicVisualizer.scss';

const PRESET_SECONDS = 30;
const BLEND_SECONDS = 2.7;

function supportsWebGL2() {
    try {
        return !!document.createElement('canvas').getContext('webgl2');
    } catch {
        return false;
    }
}

export default class MusicVisualizer {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.visualizer = null;
        this.presets = null;
        this.presetNames = [];
        this.frameId = 0;
        this.presetTimer = 0;
        this.audioNode = null;
        this.player = null;
        this.running = false;
        this.onResize = this.resize.bind(this);
        this.onVisibilityChange = this.updateLoop.bind(this);
    }

    async start() {
        if (this.running || !userSettings.enableMusicVisualizer() || !supportsWebGL2()) return;

        const player = playbackManager.getCurrentPlayer();
        if (!player || typeof player.getAudioGraph !== 'function') return;

        this.running = true;
        this.player = player;

        const [{ default: butterchurn }, { default: butterchurnPresets }] = await Promise.all([
            import(/* webpackChunkName: "butterchurn" */ 'butterchurn'),
            import(/* webpackChunkName: "butterchurn-presets" */ 'butterchurn-presets/lib/butterchurnPresets.min.js')
        ]);

        // The page may have closed while the chunks loaded
        if (!this.running) return;

        const graph = player.getAudioGraph();
        if (!graph) {
            this.running = false;
            return;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'musicVisualizerCanvas';
        this.container.prepend(this.canvas);

        const { width, height } = this.getSize();
        this.visualizer = butterchurn.createVisualizer(graph.context, this.canvas, {
            width,
            height,
            pixelRatio: window.devicePixelRatio || 1,
            textureRatio: 1
        });
        this.visualizer.connectAudio(graph.node);
        this.audioNode = graph.node;
        this.resize();

        this.presets = butterchurnPresets.getPresets();
        this.presetNames = Object.keys(this.presets);
        this.nextPreset(0);
        this.presetTimer = setInterval(() => this.nextPreset(BLEND_SECONDS), PRESET_SECONDS * 1000);

        window.addEventListener('resize', this.onResize);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.updateLoop();
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
        clearInterval(this.presetTimer);
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);

        if (this.visualizer && this.audioNode) {
            this.visualizer.disconnectAudio(this.audioNode);
        }

        if (this.canvas) {
            // Release the GPU context rather than waiting for garbage collection
            this.canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
            this.canvas.remove();
        }

        this.canvas = null;
        this.visualizer = null;
        this.audioNode = null;
        this.player = null;
    }

    nextPreset(blendSeconds) {
        if (!this.visualizer || !this.presetNames.length) return;

        const name = this.presetNames[Math.floor(Math.random() * this.presetNames.length)];
        this.visualizer.loadPreset(this.presets[name], blendSeconds);
    }

    getSize() {
        return { width: this.container.clientWidth || window.innerWidth, height: this.container.clientHeight || window.innerHeight };
    }

    resize() {
        if (!this.visualizer) return;

        const { width, height } = this.getSize();
        const ratio = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(width * ratio);
        this.canvas.height = Math.round(height * ratio);
        this.visualizer.setRendererSize(width, height);
    }

    // Draw only while the tab is visible, so a hidden tab costs no GPU time
    updateLoop() {
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;

        if (!this.running || !this.visualizer || document.hidden) return;

        const render = () => {
            this.visualizer.render();
            this.frameId = requestAnimationFrame(render);
        };
        this.frameId = requestAnimationFrame(render);
    }
}
