import RemoteControl from 'components/remotecontrol/remotecontrol';
import { playbackManager } from 'components/playback/playbackmanager';
import { clearBackdrop } from 'components/backdrop/backdrop';
import libraryMenu from 'scripts/libraryMenu';
import MusicVisualizer from 'components/musicVisualizer/musicVisualizer';
import Events from 'utils/events';
import 'elements/emby-button/emby-button';
import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-collapse/emby-collapse';
import 'elements/emby-input/emby-input';
import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-slider/emby-slider';

export default function (view) {
    const remoteControl = new RemoteControl();
    remoteControl.init(view, view.querySelector('.remoteControlContent'));
    const visualizer = new MusicVisualizer(view);

    // JellyShim: restart the visualizer when playback moves to another player
    function onPlaybackStart(e, player) {
        if (visualizer.running && visualizer.player === player) return;
        visualizer.stop();
        startVisualizer();
    }

    function startVisualizer() {
        visualizer.start().then(() => {
            view.classList.toggle('withMusicVisualizer', visualizer.running);
        }).catch(err => {
            console.error('Music visualizer failed to start', err);
            visualizer.stop();
            view.classList.remove('withMusicVisualizer');
        });
    }

    let currentPlayer;

    function onKeyDown(e) {
        if (e.keyCode === 32 && e.target.tagName !== 'BUTTON') {
            playbackManager.playPause(currentPlayer);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;
        if (player) currentPlayer = null;
    }

    function bindToPlayer(player) {
        if (player !== currentPlayer) {
            releaseCurrentPlayer();
            currentPlayer = player;
        }
    }

    view.addEventListener('viewshow', function () {
        libraryMenu.setTransparentMenu(true);
        bindToPlayer(playbackManager.getCurrentPlayer());
        document.addEventListener('keydown', onKeyDown);

        clearBackdrop();

        if (remoteControl) {
            remoteControl.onShow();
        }

        startVisualizer();
        Events.on(playbackManager, 'playbackstart', onPlaybackStart);
    });

    view.addEventListener('viewbeforehide', function () {
        libraryMenu.setTransparentMenu(false);
        document.removeEventListener('keydown', onKeyDown);
        releaseCurrentPlayer();

        Events.off(playbackManager, 'playbackstart', onPlaybackStart);
        visualizer.stop();
        view.classList.remove('withMusicVisualizer');

        if (remoteControl) {
            remoteControl.destroy();
        }
    });
}
