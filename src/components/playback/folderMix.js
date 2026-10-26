/**
 * JellyShim: "similar songs" built from the library's folders rather than
 * genre tags, which are too patchy to mix from (a quarter of the songs in a
 * large library may have none). The library is laid out Style/Band/Album, so
 * a mix from a song shuffles its style folder, with a share of its own band.
 * @module components/playback/folderMix
 */

import { ServerConnections } from 'lib/jellyfin-apiclient';

const BAND_SHARE = 4; // every 4th song comes from the same band, when it has enough

function getRandomSongs(apiClient, parentId, limit) {
    return apiClient.getItems(apiClient.getCurrentUserId(), {
        ParentId: parentId,
        Recursive: true,
        IncludeItemTypes: 'Audio',
        SortBy: 'Random',
        Limit: limit,
        // Recursive random queries take seconds on a large library; skipping the count saves a few
        EnableTotalRecordCount: false
    }).then(result => result.Items || []);
}

/**
 * Finds the style folder (just below the library) and band folder for an item.
 * @param {object} apiClient - The item's server connection.
 * @param {object} item - A song or folder.
 * @returns {Promise<{styleId: string, bandId: string}|null>} Null when the item isn't inside a folder library.
 */
async function getMixFolders(apiClient, item) {
    // Ancestors come nearest first, ending at the library and the user root
    const ancestors = await apiClient.getAncestorItems(item.Id, apiClient.getCurrentUserId());
    const libraryIndex = ancestors.findIndex(ancestor => ancestor.Type === 'CollectionFolder');
    if (libraryIndex < 0) return null;

    // Folders from the item upward, down to the style folder: [item?, ..., band, style]
    const chain = (item.Type === 'Audio' ? [] : [item]).concat(ancestors.slice(0, libraryIndex));
    if (!chain.length) return null;

    const styleId = chain[chain.length - 1].Id;
    const bandId = chain.length >= 2 ? chain[chain.length - 2].Id : styleId;
    return { styleId, bandId };
}

/**
 * Builds a mix of songs for an item from its folders.
 * @param {object} item - A song or folder.
 * @param {number} limit - How many songs to return at most.
 * @returns {Promise<object[]|null>} The songs, or null when the item can't be mixed this way.
 */
export async function getFolderMix(item, limit) {
    if (!['Audio', 'Folder', 'MusicAlbum', 'MusicArtist'].includes(item.Type)) return null;

    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const folders = await getMixFolders(apiClient, item);
    if (!folders) return null;

    const [styleSongs, bandSongs] = await Promise.all([
        getRandomSongs(apiClient, folders.styleId, limit),
        folders.bandId === folders.styleId ? [] : getRandomSongs(apiClient, folders.bandId, Math.ceil(limit / BAND_SHARE))
    ]);

    const seen = new Set([item.Id]);
    const mix = item.Type === 'Audio' ? [item] : [];
    const take = song => {
        if (song && !seen.has(song.Id)) {
            seen.add(song.Id);
            mix.push(song);
        }
    };

    let band = 0;
    for (let i = 0; i < styleSongs.length && mix.length < limit; i++) {
        if (i % BAND_SHARE === BAND_SHARE - 1) take(bandSongs[band++]);
        take(styleSongs[i]);
    }

    return mix.slice(0, limit);
}
