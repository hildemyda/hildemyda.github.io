// Elemen DOM
const albumArt = document.getElementById('album-art');
const songTitle = document.getElementById('song-title');
const artistName = document.getElementById('artist-name');
const progressBar = document.getElementById('progress-bar');
const currentTimeSpan = document.getElementById('current-time');
const durationSpan = document.getElementById('duration');
const prevBtn = document.getElementById('prev-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const nextBtn = document.getElementById('next-btn');
const searchInput = document.getElementById('search-input');

// Elemen Modal
const messageModal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Elemen baru untuk loading modal
const loadingModal = document.getElementById('loading-modal');

// Elemen untuk fungsionalitas sembunyikan/tampilkan
const playerBar = document.getElementById('player-bar');
const togglePlayerBtn = document.getElementById('toggle-player-btn');
const mainContentArea = document.getElementById('main-content-area');
const togglePlayerButtonWrapper = document.getElementById('toggle-player-button-wrapper');

// Elemen untuk fungsionalitas playlist
const currentViewTitle = document.getElementById('current-view-title');
const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
const initialSongsDisplay = document.getElementById('initial-songs-display');
const playlistsSectionTitle = document.getElementById('playlists-section-title');
const playlistsDisplay = document.getElementById('playlists-display');
const songsListDisplay = document.getElementById('songs-list-display');
const playlistSeparator = document.getElementById('playlist-separator');

// Elemen untuk fitur putar ulang
const repeatOneBtn = document.getElementById('repeat-one-btn');

// Elemen untuk fitur lirik (sekarang modal)
const lyricsModal = document.getElementById('lyrics-modal');
const lyricsModalContent = document.getElementById('lyrics-modal-content');
const lyricsModalCloseBtn = document.getElementById('lyrics-modal-close-btn');
const toggleLyricsBtn = document.getElementById('toggle-lyrics-btn');
// Elemen baru untuk judul dan artis di modal lirik
const lyricsSongArtistInfo = document.getElementById('lyrics-song-artist-info');


let isPlayerHidden = false; // Status awal: pemutar terlihat

// Objek Audio
const audio = new Audio();
let isPlaying = false;
let currentPlayingSongIndex = 0; // Index dari lagu yang sedang diputar dalam currentPlayingSongs
let currentPlayingSongElement = null; // Referensi ke elemen DOM lagu yang sedang diputar
let repeatMode = 'none'; // 'none', 'one'
let isLyricsVisible = false; // State for lyrics visibility (for the modal)

// allPlaylists now comes from data.js

// Flatten all songs from all playlists to create a master list for search and initial display
let allSongsFlat = [];
allPlaylists.forEach(playlist => {
    allSongsFlat = allSongsFlat.concat(playlist.songs);
});

// Ambil jumlah lagu yang Anda inginkan untuk tampilan awal
// Contoh 1: Ambil 10 lagu pertama
const initialSongs = allSongsFlat.slice(0, 5);

// Contoh 2: Ambil semua lagu yang tersedia (hapus .slice() )
// const initialSongs = allSongsFlat;

let currentPlayingSongs = []; // Daftar lagu yang sedang aktif (dari playlist atau hasil pencarian)
let currentDisplayMode = 'main'; // 'main', 'songsInPlaylist', 'searchResults'
let currentViewingPlaylistId = null; // ID playlist yang sedang dilihat lagunya

// Fungsi untuk menampilkan modal pesan
function showMessage(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    messageModal.style.display = 'flex'; // Tampilkan modal
    // Fade in the message modal
    setTimeout(() => {
        messageModal.classList.add('modal-visible');
    }, 10);
}

// Fungsi untuk menyembunyikan modal pesan
function hideMessage() {
    modalMessage.classList.remove('modal-visible'); // Trigger fade-out
    setTimeout(() => {
        modalMessage.style.display = 'none'; // Hide after transition
    }, 300); // Match CSS transition duration (0.3s)
}

// Event listener untuk tombol tutup modal
modalCloseBtn.addEventListener('click', hideMessage);

// Fungsi untuk menampilkan modal loading
function showLoading() {
    loadingModal.style.display = 'flex';
    // Fade in the loading modal
    setTimeout(() => {
        loadingModal.classList.add('modal-visible');
    }, 10); // Small delay to allow display:flex to apply before transition
}

// Fungsi untuk menyembunyikan modal loading
function hideLoading() {
    loadingModal.classList.remove('modal-visible'); // Trigger fade-out
    setTimeout(() => {
        loadingModal.style.display = 'none'; // Hide after transition
    }, 300); // Match CSS transition duration (0.3s)
}

// Deklarasikan handleLoadedMetadata di luar agar bisa diakses oleh removeEventListener
let handleLoadedMetadata;

// Fungsi untuk memuat dan memutar lagu
function loadTrack(index) {
    if (index < 0 || index >= currentPlayingSongs.length) {
        console.error("Indeks trek tidak valid.");
        return;
    }

    // Sembunyikan music bar dari lagu sebelumnya jika ada
    if (currentPlayingSongElement) {
        const prevMusicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
        if (prevMusicBar) {
            prevMusicBar.classList.remove('opacity-100');
            prevMusicBar.classList.add('opacity-0');
        }
    }

    currentPlayingSongIndex = index;
    const track = currentPlayingSongs[currentPlayingSongIndex];

    showLoading(); // Tampilkan loading saat lagu baru dimuat

    audio.src = track.src;
    songTitle.textContent = track.title;
    artistName.textContent = track.artist;
    albumArt.src = track.albumArt;
    albumArt.onerror = () => {
        albumArt.src = 'https://placehold.co/64x64/374151/d1d5db?text=No+Art';
    }; // Fallback jika gambar tidak bisa dimuat

    // Update lyrics display in the modal
    if (track.lyrics) {
        lyricsModalContent.textContent = track.lyrics;
        lyricsSongArtistInfo.textContent = `${track.artist} - ${track.title}`; // Set combined info
        toggleLyricsBtn.style.display = 'block'; // Show lyrics button if lyrics exist
        // If lyrics modal was visible for the previous song, keep it visible for this one
        if (isLyricsVisible) {
            lyricsModal.style.display = 'flex';
            setTimeout(() => lyricsModal.classList.add('modal-visible'), 10);
        }
    } else {
        lyricsModalContent.textContent = 'Lirik tidak tersedia untuk lagu ini.';
        lyricsSongArtistInfo.textContent = ''; // Clear combined info
        toggleLyricsBtn.style.display = 'none'; // Hide lyrics button if no lyrics
        lyricsModal.classList.remove('modal-visible'); // Ensure lyrics modal is hidden
        setTimeout(() => lyricsModal.style.display = 'none', 300);
        isLyricsVisible = false; // Reset lyrics visibility state
    }
    updateLyricsButtonDisplay(); // Update button color based on isLyricsVisible

    // Hapus kelas 'active' dari semua item playlist
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('bg-green-700', 'text-white');
        item.classList.add('bg-neutral-700', 'hover:bg-neutral-600');
    });

    // Tambahkan kelas 'active' ke item playlist yang sedang diputar
    const activePlaylistItem = document.querySelector(`.playlist-item[data-src="${track.src}"]`);
    if (activePlaylistItem) {
        activePlaylistItem.classList.add('bg-green-700', 'text-white');
        activePlaylistItem.classList.remove('bg-neutral-700', 'hover:bg-neutral-600');
        currentPlayingSongElement = activePlaylistItem; // Simpan referensi ke elemen lagu yang sedang diputar
    } else {
        currentPlayingSongElement = null; // Reset jika tidak ditemukan (misal, setelah pencarian baru)
    }

    // Hapus listener loadedmetadata sebelumnya untuk mencegah duplikasi
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    // Tambahkan listener loadedmetadata baru (hanya sekali jalan)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata = () => {
        durationSpan.textContent = formatTime(audio.duration);
        progressBar.max = 100;
        hideLoading(); // Sembunyikan loading setelah metadata dimuat

        // Hanya coba putar jika pemutar sedang dalam mode putar atau baru saja di-toggle ke putar
        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    isPlaying = true;
                    hideLoading(); // Sembunyikan loading saat berhasil diputar
                    // Tampilkan music bar pada lagu yang sedang diputar
                    if (currentPlayingSongElement) {
                        const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
                        if (musicBar) {
                            musicBar.classList.remove('opacity-0');
                            musicBar.classList.add('opacity-100');
                        }
                    }
                }).catch(error => {
                    console.error("Gagal memutar audio secara otomatis setelah memuat trek baru:", error);
                    isPlaying = false;
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    showMessage("Autoplay Diblokir", "Browser Anda mungkin memblokir pemutaran otomatis. Silakan klik tombol putar.");
                    hideLoading(); // Sembunyikan loading jika autoplay gagal
                    // Sembunyikan music bar saat error
                    if (currentPlayingSongElement) {
                        const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
                        if (musicBar) {
                            musicBar.classList.remove('opacity-100');
                            musicBar.classList.add('opacity-0');
                        }
                    }
                });
            }
        }
    }, { once: true }); // Pastikan listener ini hanya berjalan sekali per pemuatan

    // Tambahkan listener untuk event error pada audio
    audio.addEventListener('error', (e) => {
        console.error("Kesalahan audio:", e);
        hideLoading(); // Sembunyikan loading jika ada kesalahan
        showMessage("Kesalahan Audio", "Terjadi kesalahan saat memutar audio. File mungkin rusak atau tidak dapat diakses.");
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        // Sembunyikan music bar saat error
        if (currentPlayingSongElement) {
            const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
            if (musicBar) {
                musicBar.classList.remove('opacity-100');
                musicBar.classList.add('opacity-0');
            }
        }
    }, { once: true }); // Hanya berjalan sekali per kesalahan
}

// Fungsi untuk memutar/menjeda
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        hideLoading(); // Sembunyikan loading segera saat jeda
        // Sembunyikan music bar
        if (currentPlayingSongElement) {
            const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
            if (musicBar) {
                musicBar.classList.remove('opacity-100');
                musicBar.classList.add('opacity-0');
            }
        }
    } else {
        showLoading(); // Tampilkan loading saat mencoba memutar
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                isPlaying = true;
                hideLoading(); // Sembunyikan loading saat berhasil diputar
                // Tampilkan music bar
                if (currentPlayingSongElement) {
                    const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
                    if (musicBar) {
                        musicBar.classList.remove('opacity-0');
                        musicBar.classList.add('opacity-100');
                    }
                }
            }).catch(e => {
                console.error("Gagal memutar audio:", e);
                showMessage("Kesalahan Pemutaran", "Gagal memutar audio. Pastikan URL audio valid dan browser mengizinkan pemutaran otomatis.");
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                hideLoading(); // Sembunyikan loading jika pemutaran gagal
                // Sembunyikan music bar saat gagal
                if (currentPlayingSongElement) {
                    const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
                    if (musicBar) {
                        musicBar.classList.remove('opacity-100');
                        musicBar.classList.add('opacity-0');
                    }
                }
            });
        } else {
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            hideLoading(); // Fallback sembunyikan untuk browser lama tanpa playPromise
            // Tampilkan music bar
            if (currentPlayingSongElement) {
                const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
                if (musicBar) {
                    musicBar.classList.remove('opacity-0');
                    musicBar.classList.add('opacity-100');
                }
            }
        }
    }
}

// Fungsi untuk memutar lagu berikutnya
function playNext() {
    currentPlayingSongIndex = (currentPlayingSongIndex + 1) % currentPlayingSongs.length;
    loadTrack(currentPlayingSongIndex);
}

// Fungsi untuk memutar lagu sebelumnya
function playPrev() {
    currentPlayingSongIndex = (currentPlayingSongIndex - 1 + currentPlayingSongs.length) % currentPlayingSongs.length;
    loadTrack(currentPlayingSongIndex);
}

// Fungsi untuk memformat waktu (detik ke MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Fungsi untuk memperbarui tampilan tombol putar ulang
function updateRepeatButtonDisplay() {
    // Hapus kelas warna hijau dari tombol putar ulang
    repeatOneBtn.classList.remove('text-green-500');
    repeatOneBtn.classList.add('text-neutral-400'); // Pastikan warna default

    // Jika mode putar ulang adalah 'one', tambahkan kelas warna hijau
    if (repeatMode === 'one') {
        repeatOneBtn.classList.remove('text-neutral-400');
        repeatOneBtn.classList.add('text-green-500');
    }
}

// Fungsi untuk mengganti mode putar ulang
function toggleRepeatMode() {
    if (repeatMode === 'one') {
        repeatMode = 'none';
    } else {
        repeatMode = 'one';
    }
    updateRepeatButtonDisplay(); // Perbarui tampilan tombol setelah perubahan mode
}

// Fungsi untuk memperbarui tampilan tombol lirik (warna)
function updateLyricsButtonDisplay() {
    if (isLyricsVisible) {
        toggleLyricsBtn.classList.remove('text-neutral-400');
        toggleLyricsBtn.classList.add('text-green-500');
    } else {
        toggleLyricsBtn.classList.remove('text-green-500');
        toggleLyricsBtn.classList.add('text-neutral-400');
    }
}

// Fungsi untuk mengganti tampilan lirik (modal)
function toggleLyricsDisplay() {
    if (isLyricsVisible) {
        lyricsModal.classList.remove('modal-visible'); // Trigger fade-out
        setTimeout(() => {
            lyricsModal.style.display = 'none'; // Hide after transition
        }, 300); // Match CSS transition duration (0.3s)
    } else {
        lyricsModal.style.display = 'flex'; // Show modal
        // Fade in the modal
        setTimeout(() => {
            lyricsModal.classList.add('modal-visible');
        }, 10);
    }
    isLyricsVisible = !isLyricsVisible;
    updateLyricsButtonDisplay(); // Perbarui tampilan tombol setelah perubahan mode
}

// Event Listeners untuk kontrol pemutar
playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);
repeatOneBtn.addEventListener('click', toggleRepeatMode);
toggleLyricsBtn.addEventListener('click', toggleLyricsDisplay); // Event listener untuk tombol lirik
lyricsModalCloseBtn.addEventListener('click', toggleLyricsDisplay); // Event listener untuk tombol tutup modal lirik

audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = isNaN(progress) ? 0 : progress;
    currentTimeSpan.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('ended', () => {
    hideLoading(); // Sembunyikan loading saat trek berakhir
    // Sembunyikan music bar saat lagu berakhir
    if (currentPlayingSongElement) {
        const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
        if (musicBar) {
            musicBar.classList.remove('opacity-100');
            musicBar.classList.add('opacity-0');
        }
    }

    if (repeatMode === 'one') {
        audio.currentTime = 0; // Kembali ke awal lagu
        audio.play(); // Putar ulang lagu saat ini
        // Tampilkan music bar lagi karena lagu diputar ulang
        if (currentPlayingSongElement) {
            const musicBar = currentPlayingSongElement.querySelector('.music-bar-animation');
            if (musicBar) {
                musicBar.classList.remove('opacity-0');
                musicBar.classList.add('opacity-100');
            }
        }
    } else {
        // Lagu akan otomatis berlanjut ke lagu berikutnya
        // dan mengulang ke lagu pertama jika daftar putar selesai.
        playNext();
    }
});

progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
});

// --- Fungsionalitas Tampilan ---

// Fungsi generik untuk merender daftar lagu
function renderSongsList(containerElement, songsArray) {
    containerElement.innerHTML = '';
    if (songsArray.length === 0) {
        containerElement.innerHTML = '<p class="text-neutral-400 text-center mt-8">Tidak ada lagu yang ditemukan.</p>';
        return;
    }

    songsArray.forEach((track, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.classList.add(
            'playlist-item', 'flex', 'items-center', 'bg-neutral-700', 'hover:bg-neutral-600', 'cursor-pointer', 'rounded-lg', 'p-2', 'md:p-3', // Padding disesuaikan
            'transition-colors', 'relative'
        );
        playlistItem.dataset.src = track.src; // Gunakan src untuk identifikasi unik

        playlistItem.innerHTML = `
            <div class="w-12 h-12 md:w-14 md:h-14 bg-neutral-600 rounded-md overflow-hidden flex-shrink-0 mr-3 md:mr-4 relative"> <img src="${track.albumArt}" alt="Album Art" class="w-full h-full object-cover">
                <div class="music-bar-animation opacity-0">
                    <span class="music-bar-line"></span>
                    <span class="music-bar-line"></span>
                    <span class="music-bar-line"></span>
                </div>
            </div>
            <div class="flex-grow overflow-hidden">
                <p class="text-white font-medium truncate text-base md:text-lg">${track.title}</p> <p class="text-neutral-400 text-xs md:text-sm truncate">${track.artist}</p> </div>
            <span class="playlist-item-duration text-neutral-500 text-xs md:text-sm ml-2 md:ml-4">--:--</span> `;
        containerElement.appendChild(playlistItem);

        playlistItem.addEventListener('click', () => {
            // Temukan indeks lagu di currentPlayingSongs (daftar lagu yang sedang aktif)
            const actualIndex = currentPlayingSongs.findIndex(song => song.src === track.src);
            if (actualIndex !== -1) {
                loadTrack(actualIndex);
                if (!isPlaying) {
                    togglePlayPause();
                }
            } else {
                // Jika lagu tidak ada di currentPlayingSongs, tambahkan dan putar
                currentPlayingSongs = [track]; // Hapus playlist saat ini dan ganti dengan lagu yang dipilih
                loadTrack(0);
                if (!isPlaying) {
                    togglePlayPause();
                }
            }
        });

        const tempAudio = new Audio(track.src);
        tempAudio.addEventListener('loadedmetadata', () => {
            playlistItem.querySelector('.playlist-item-duration').textContent = formatTime(tempAudio.duration);
        });
    });
}

// Fungsi untuk merender daftar playlist (kartu)
function renderPlaylistsCards() {
    playlistsDisplay.innerHTML = '';
    allPlaylists.forEach(playlist => {
        const playlistCard = document.createElement('div');
        playlistCard.classList.add(
            'bg-neutral-700', 'hover:bg-neutral-600', 'cursor-pointer', 'rounded-lg', 'p-3', 'md:p-4', // Padding disesuaikan
            'flex', 'items-center', 'transition-colors'
        );
        playlistCard.dataset.playlistId = playlist.id;

        playlistCard.innerHTML = `
            <div class="flex-grow">
                <p class="text-white font-bold text-lg md:text-xl truncate">${playlist.name}</p> <p class="text-neutral-400 text-xs md:text-sm truncate">${playlist.description}</p> <p class="text-neutral-500 text-xs mt-1">${playlist.songs.length} lagu</p>
            </div>
        `;
        playlistsDisplay.appendChild(playlistCard);

        playlistCard.addEventListener('click', () => {
            showSongsInPlaylist(playlist.id);
        });
    });
}

// Fungsi untuk menampilkan tampilan utama (5 lagu awal + daftar playlist)
function renderMainView() {
    currentDisplayMode = 'main';
    currentViewingPlaylistId = null;
    currentViewTitle.textContent = 'Beranda';
    backToMainViewBtn.classList.add('hidden');

    initialSongsDisplay.classList.remove('hidden');
    playlistsSectionTitle.classList.remove('hidden');
    playlistsDisplay.classList.remove('hidden');
    playlistSeparator.classList.remove('hidden');
    songsListDisplay.classList.add('hidden');

    // Sembunyikan modal lirik saat kembali ke tampilan utama
    lyricsModal.classList.remove('modal-visible');
    setTimeout(() => lyricsModal.style.display = 'none', 300);
    isLyricsVisible = false;
    updateLyricsButtonDisplay(); // Perbarui warna tombol lirik

    renderSongsList(initialSongsDisplay, initialSongs);
    renderPlaylistsCards();

    // Reset search input
    searchInput.value = '';
}

// Fungsi untuk menampilkan lagu-lagu dalam playlist tertentu
function showSongsInPlaylist(playlistId) {
    const selectedPlaylist = allPlaylists.find(p => p.id === playlistId);
    if (selectedPlaylist) {
        currentPlayingSongs = selectedPlaylist.songs;
        currentViewingPlaylistId = playlistId;
        currentDisplayMode = 'songsInPlaylist';
        currentViewTitle.textContent = selectedPlaylist.name;
        backToMainViewBtn.classList.remove('hidden');

        initialSongsDisplay.classList.add('hidden');
        playlistsSectionTitle.classList.add('hidden');
        playlistsDisplay.classList.add('hidden');
        playlistSeparator.classList.add('hidden');
        songsListDisplay.classList.remove('hidden');

        // Sembunyikan modal lirik saat beralih playlist
        lyricsModal.classList.remove('modal-visible');
        setTimeout(() => lyricsModal.style.display = 'none', 300);
        isLyricsVisible = false;
        updateLyricsButtonDisplay(); // Perbarui warna tombol lirik


        renderSongsList(songsListDisplay, currentPlayingSongs);
        // Hapus logika untuk memuat lagu pertama di sini
    } else {
        console.error("Playlist tidak ditemukan:", playlistId);
        showMessage("Kesalahan", "Playlist tidak ditemukan.");
    }
}

// Fungsi untuk menangani input pencarian
function handleSearchInput() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        renderMainView(); // Kembali ke tampilan utama jika pencarian kosong
    } else {
        let allSongsFlatForSearch = [];
        allPlaylists.forEach(playlist => {
            allSongsFlatForSearch = allSongsFlatForSearch.concat(playlist.songs);
        });
        const filteredSongs = allSongsFlatForSearch.filter(track =>
            track.title.toLowerCase().includes(searchTerm) ||
            track.artist.toLowerCase().includes(searchTerm)
        );

        currentPlayingSongs = filteredSongs;
        currentDisplayMode = 'searchResults';
        currentViewTitle.textContent = `Hasil Pencarian untuk "${searchTerm}"`;
        backToMainViewBtn.classList.remove('hidden');

        initialSongsDisplay.classList.add('hidden');
        playlistsSectionTitle.classList.add('hidden');
        playlistsDisplay.classList.add('hidden');
        playlistSeparator.classList.add('hidden');
        songsListDisplay.classList.remove('hidden');

        // Sembunyikan modal lirik saat melakukan pencarian baru
        lyricsModal.classList.remove('modal-visible');
        setTimeout(() => lyricsModal.style.display = 'none', 300);
        isLyricsVisible = false;
        updateLyricsButtonDisplay(); // Perbarui warna tombol lirik

        renderSongsList(songsListDisplay, currentPlayingSongs);
        // Hapus logika untuk memuat lagu pertama di sini
    }
}

// Event listener untuk tombol kembali ke tampilan utama
backToMainViewBtn.addEventListener('click', () => {
    renderMainView();
});

// Event listener untuk input pencarian
searchInput.addEventListener('input', handleSearchInput);

// --- Fungsionalitas sembunyikan/tampilkan player bawah ---
let playerBarFullHeight = 0; // Akan menyimpan tinggi penuh bilah pemutar saat terlihat

// Fungsi untuk memperbarui padding bawah area konten utama
function updateMainContentPadding() {
    if (isPlayerHidden) {
        // Ketika player tersembunyi, padding harus memperhitungkan tinggi tombol toggle + margin
        const toggleButtonHeight = togglePlayerButtonWrapper.offsetHeight;
        const toggleButtonMarginBottom = 16; // bottom-4 = 16px
        mainContentArea.style.paddingBottom = `${toggleButtonHeight + toggleButtonMarginBottom + 16}px`; // +16px extra for aesthetic
    } else {
        // Ketika player terlihat, padding harus memperhitungkan seluruh bilah player
        mainContentArea.style.paddingBottom = `${playerBarFullHeight + 16}px`; // +16px extra for aesthetic
    }
}

togglePlayerBtn.addEventListener('click', () => {
    if (isPlayerHidden) {
        playerBar.classList.remove('translate-y-full'); // Tampilkan player (geser ke atas)
        togglePlayerBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Ubah ikon menjadi panah bawah
    } else {
        playerBar.classList.add('translate-y-full'); // Sembunyikan player (geser ke bawah)
        togglePlayerBtn.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Ubah ikon menjadi panah atas
    }
    isPlayerHidden = !isPlayerHidden; // Balik status
    // Update padding immediately after toggling
    updateMainContentPadding();
});

// Inisialisasi: Muat daftar playlist dan lagu pertama saat halaman dimuat
window.onload = () => {
    renderMainView(); // Tampilkan tampilan utama (5 lagu awal + daftar playlist)

    // Lagu pertama akan dimuat tetapi tidak diputar otomatis
    if (initialSongs.length > 0) {
        currentPlayingSongs = initialSongs;
        loadTrack(0); // Muat lagu pertama
        isPlaying = false; // Pastikan status putar adalah false
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; // Pastikan ikon play ditampilkan
    }

    // Dapatkan tinggi penuh bilah pemutar saat terlihat
    playerBar.classList.remove('translate-y-full');
    playerBarFullHeight = playerBar.offsetHeight;
    
    // Atur status awal player ke terlihat
    isPlayerHidden = false; // Player terlihat di awal
    togglePlayerBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Set ikon panah ke bawah

    updateMainContentPadding(); // Set padding awal
    window.addEventListener('resize', updateMainContentPadding); // Perbarui pada perubahan ukuran jendela
    updateRepeatButtonDisplay(); // Perbarui tampilan tombol putar ulang saat memuat
    updateLyricsButtonDisplay(); // Perbarui tampilan tombol lirik saat memuat
};
