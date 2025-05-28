 // Variables globales
 let currentUser = null;
 let currentSong = null;
 let isPlaying = false;
 let currentPlaylist = [];
 let currentIndex = 0;
 let songs = [];
 let userSongs = [];
 let playlists = [];
 
 // IndexedDB para almacenamiento local
 let db;
 
 // Inicializar la aplicación
 document.addEventListener('DOMContentLoaded', function() {
     initIndexedDB();
     initAudioPlayer();
     initVisualizer();
     loadSongs();
     checkUserSession();
     
     // Event listeners
     document.getElementById('login-form').addEventListener('submit', handleLogin);
     document.getElementById('register-form').addEventListener('submit', handleRegister);
     document.getElementById('upload-form').addEventListener('submit', handleUpload);
     document.getElementById('main-search').addEventListener('input', handleSearch);
     document.getElementById('search-input').addEventListener('input', handleSearch);
     
     // Volume control
     document.getElementById('volume-slider').addEventListener('input', function() {
         const audio = document.getElementById('audio-player');
         audio.volume = this.value / 100;
     });
 });
 
 // IndexedDB initialization
 function initIndexedDB() {
     const request = indexedDB.open('MusicStreamDB', 1);
     
     request.onerror = function(event) {
         console.error('Error opening IndexedDB:', event);
     };
     
     request.onsuccess = function(event) {
         db = event.target.result;
         loadCachedData();
     };
     
     request.onupgradeneeded = function(event) {
         db = event.target.result;
         
         // Store for recently played songs
         if (!db.objectStoreNames.contains('recentlyPlayed')) {
             const recentStore = db.createObjectStore('recentlyPlayed', { keyPath: 'id', autoIncrement: true });
             recentStore.createIndex('timestamp', 'timestamp', { unique: false });
         }
         
         // Store for cached songs
         if (!db.objectStoreNames.contains('cachedSongs')) {
             const songStore = db.createObjectStore('cachedSongs', { keyPath: 'id' });
             songStore.createIndex('title', 'title', { unique: false });
             songStore.createIndex('artist', 'artist', { unique: false });
         }
         
         // Store for user data
         if (!db.objectStoreNames.contains('users')) {
             const userStore = db.createObjectStore('users', { keyPath: 'email' });
         }
         
         // Store for playlists
         if (!db.objectStoreNames.contains('playlists')) {
             const playlistStore = db.createObjectStore('playlists', { keyPath: 'id', autoIncrement: true });
             playlistStore.createIndex('userId', 'userId', { unique: false });
         }
     };
 }
 
 // Cargar datos en caché
 function loadCachedData() {
     // Implementar carga de datos desde IndexedDB
     if (!db) return;
     
     const transaction = db.transaction(['cachedSongs'], 'readonly');
     const store = transaction.objectStore('cachedSongs');
     const request = store.getAll();
     
     request.onsuccess = function(event) {
         if (event.target.result.length > 0) {
             songs = event.target.result;
             renderSongs(songs, 'music-grid');
         }
     };
 }
 
 // Inicializar reproductor de audio
 function initAudioPlayer() {
     const audio = document.getElementById('audio-player');
     
     // Actualizar barra de progreso
     audio.addEventListener('timeupdate', function() {
         const progress = document.getElementById('progress');
         const percent = (audio.currentTime / audio.duration) * 100;
         progress.style.width = percent + '%';
     });
     
     // Cuando termina la canción
     audio.addEventListener('ended', function() {
         nextSong();
     });
     
     // Actualizar UI cuando se carga metadata
     audio.addEventListener('loadedmetadata', function() {
         updatePlayerUI();
     });
 }
 
 // Inicializar visualizador
 function initVisualizer() {
     // Implementación del visualizador con p5.js
     new p5(function(p) {
         let mic;
         let fft;
         
         p.setup = function() {
             const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
             canvas.parent('visualizer');
             p.colorMode(p.HSB, 255);
             p.noStroke();
             
             mic = new p5.AudioIn();
             mic.start();
             
             fft = new p5.FFT();
             fft.setInput(mic);
         };
         
         p.draw = function() {
             p.clear();
             if (!isPlaying) return;
             
             let spectrum = fft.analyze();
             for (let i = 0; i < spectrum.length; i++) {
                 let x = p.map(i, 0, spectrum.length, 0, p.width);
                 let h = -p.height + p.map(spectrum[i], 0, 255, p.height, 0);
                 let hue = p.map(i, 0, spectrum.length, 0, 255);
                 p.fill(hue, 255, 255, 0.5);
                 p.rect(x, p.height, p.width / spectrum.length, h);
             }
         };
         
         p.windowResized = function() {
             p.resizeCanvas(window.innerWidth, window.innerHeight);
         };
     });
 }
 
 // Cargar canciones desde el servidor
 function loadSongs() {
     // Simulación de carga de canciones desde un servidor
     // En una implementación real, esto sería una llamada AJAX a un backend
     setTimeout(() => {
         if (songs.length === 0) {
             const demoSongs = [
                 {
                     id: 1,
                     title: 'Bohemian Rhapsody',
                     artist: 'Queen',
                     album: 'A Night at the Opera',
                     file: 'https://file-examples.com/storage/fe8c7eef0c6364f6c9504cc/2017/11/file_example_MP3_700KB.mp3'
                 },
                 {
                     id: 2,
                     title: 'Imagine',
                     artist: 'John Lennon',
                     album: 'Imagine',
                     file: 'https://file-examples.com/storage/fe8c7eef0c6364f6c9504cc/2017/11/file_example_MP3_1MG.mp3'
                 },
                 {
                     id: 3,
                     title: 'Billie Jean',
                     artist: 'Michael Jackson',
                     album: 'Thriller',
                     file: 'https://file-examples.com/storage/fe8c7eef0c6364f6c9504cc/2017/11/file_example_MP3_2MG.mp3'
                 },
                 {
                     id: 4,
                     title: 'Shape of You',
                     artist: 'Ed Sheeran',
                     album: 'Divide',
                     file: 'https://file-examples.com/storage/fe8c7eef0c6364f6c9504cc/2017/11/file_example_MP3_5MG.mp3'
                 }
             ];
             
             songs = demoSongs;
             
             // Guardar en IndexedDB
             if (db) {
                 const transaction = db.transaction(['cachedSongs'], 'readwrite');
                 const store = transaction.objectStore('cachedSongs');
                 
                 demoSongs.forEach(song => {
                     store.put(song);
                 });
             }
             
             renderSongs(songs, 'music-grid');
         }
     }, 1000);
 }
 
 // Renderizar canciones en un contenedor
 function renderSongs(songsArray, containerId) {
     const container = document.getElementById(containerId);
     container.innerHTML = '';
     
     songsArray.forEach(song => {
         const card = document.createElement('div');
         card.className = 'music-card';
         card.innerHTML = `
             <div class="music-info">
                 <h3>${song.title}</h3>
                 <p>${song.artist}</p>
                 <p class="album">${song.album || 'Single'}</p>
             </div>
             <div class="card-actions">
                 <button class="play-card-btn" onclick="playSong(${song.id})">▶️</button>
                 ${currentUser ? `<button class="add-to-playlist-btn" onclick="showAddToPlaylistModal(${song.id})">+📋</button>` : ''}
             </div>
         `;
         container.appendChild(card);
     });
 }
 
 // Reproducir canción
 function playSong(songId) {
     const song = songs.find(s => s.id === songId) || userSongs.find(s => s.id === songId);
     if (!song) return;
     
     currentSong = song;
     currentPlaylist = songs.concat(userSongs);
     currentIndex = currentPlaylist.findIndex(s => s.id === songId);
     
     const audio = document.getElementById('audio-player');
     audio.src = song.file;
     audio.play();
     isPlaying = true;
     
     updatePlayerUI();
     document.getElementById('player').style.display = 'block';
     
     // Guardar en historial reciente
     if (db) {
         const transaction = db.transaction(['recentlyPlayed'], 'readwrite');
         const store = transaction.objectStore('recentlyPlayed');
         
         store.put({
             songId: song.id,
             timestamp: Date.now()
         });
     }
 }
 
 // Actualizar UI del reproductor
 function updatePlayerUI() {
     if (!currentSong) return;
     
     document.getElementById('player-title').textContent = currentSong.title;
     document.getElementById('player-artist').textContent = currentSong.artist;
     
     const playBtn = document.getElementById('play-btn');
     playBtn.textContent = isPlaying ? '⏸️' : '▶️';
 }
 
 // Alternar reproducción/pausa
 function togglePlay() {
     const audio = document.getElementById('audio-player');
     
     if (isPlaying) {
         audio.pause();
         isPlaying = false;
     } else {
         audio.play();
         isPlaying = true;
     }
     
     updatePlayerUI();
 }
 
 // Canción anterior
 function previousSong() {
     if (currentIndex <= 0) {
         currentIndex = currentPlaylist.length - 1;
     } else {
         currentIndex--;
     }
     
     currentSong = currentPlaylist[currentIndex];
     playSong(currentSong.id);
 }
 
 // Canción siguiente
 function nextSong() {
     if (currentIndex >= currentPlaylist.length - 1) {
         currentIndex = 0;
     } else {
         currentIndex++;
     }
     
     currentSong = currentPlaylist[currentIndex];
     playSong(currentSong.id);
 }
 
 // Buscar en la posición de la barra de progreso
 function seek(event) {
     const audio = document.getElementById('audio-player');
     const progressBar = document.querySelector('.progress-bar');
     const rect = progressBar.getBoundingClientRect();
     const percent = (event.clientX - rect.left) / rect.width;
     
     audio.currentTime = percent * audio.duration;
 }
 
 // Verificar sesión de usuario
 function checkUserSession() {
     // En una implementación real, verificaríamos un token JWT o similar
     const savedUser = localStorage.getItem('currentUser');
     
     if (savedUser) {
         currentUser = JSON.parse(savedUser);
         updateUIForLoggedUser();
     }
 }
 
 // Actualizar UI para usuario logueado
 function updateUIForLoggedUser() {
     document.getElementById('user-info').classList.remove('hidden');
     document.getElementById('auth-buttons').classList.add('hidden');
     document.getElementById('user-name').textContent = currentUser.name;
     
     document.getElementById('upload-menu').classList.remove('hidden');
     document.getElementById('my-music-menu').classList.remove('hidden');
     document.getElementById('playlists-menu').classList.remove('hidden');
     
     // Cargar canciones del usuario
     loadUserSongs();
 }
 
 // Cargar canciones del usuario
 function loadUserSongs() {
     // En una implementación real, esto sería una llamada AJAX
     if (currentUser && currentUser.songs) {
         userSongs = currentUser.songs;
         renderSongs(userSongs, 'my-music-grid');
     }
 }
 
 // Manejar inicio de sesión
 function handleLogin(event) {
     event.preventDefault();
     
     const email = document.getElementById('login-email').value;
     const password = document.getElementById('login-password').value;
     
     // En una implementación real, esto sería una llamada AJAX a un backend
     if (db) {
         const transaction = db.transaction(['users'], 'readonly');
         const store = transaction.objectStore('users');
         const request = store.get(email);
         
         request.onsuccess = function(event) {
             const user = event.target.result;
             
             if (user && user.password === password) {
                 currentUser = user;
                 localStorage.setItem('currentUser', JSON.stringify(user));
                 updateUIForLoggedUser();
                 closeModal('login');
             } else {
                 alert('Credenciales incorrectas');
             }
         };
     } else {
         // Fallback para demo
         currentUser = {
             name: 'Usuario Demo',
             email: email,
             songs: []
         };
         localStorage.setItem('currentUser', JSON.stringify(currentUser));
         updateUIForLoggedUser();
         closeModal('login');
     }
 }
 
 // Manejar registro
 function handleRegister(event) {
     event.preventDefault();
     
     const name = document.getElementById('register-name').value;
     const email = document.getElementById('register-email').value;
     const password = document.getElementById('register-password').value;
     const confirm = document.getElementById('register-confirm').value;
     
     if (password !== confirm) {
         alert('Las contraseñas no coinciden');
         return;
     }
     
     const newUser = {
         name: name,
         email: email,
         password: password,
         songs: []
     };
     
     // En una implementación real, esto sería una llamada AJAX a un backend
     if (db) {
         const transaction = db.transaction(['users'], 'readwrite');
         const store = transaction.objectStore('users');
         const request = store.put(newUser);
         
         request.onsuccess = function() {
             currentUser = newUser;
             localStorage.setItem('currentUser', JSON.stringify(newUser));
             updateUIForLoggedUser();
             closeModal('register');
         };
     } else {
         // Fallback para demo
         currentUser = newUser;
         localStorage.setItem('currentUser', JSON.stringify(newUser));
         updateUIForLoggedUser();
         closeModal('register');
     }
 }
 
 // Manejar subida de canción
 function handleUpload(event) {
     event.preventDefault();
     
     if (!currentUser) {
         alert('Debes iniciar sesión para subir música');
         return;
     }
     
     const title = document.getElementById('song-title').value;
     const artist = document.getElementById('song-artist').value;
     const album = document.getElementById('song-album').value;
     const audioFile = document.getElementById('audio-file').files[0];
     
     if (!audioFile) {
         alert('Debes seleccionar un archivo de audio');
         return;
     }
     
     // En una implementación real, subiríamos los archivos a un servidor
     // Para esta demo, creamos URLs locales
     const songId = Date.now();
     const song = {
         id: songId,
         title: title,
         artist: artist,
         album: album,
         file: URL.createObjectURL(audioFile)
     };
     
     // Agregar a las canciones del usuario
     if (!currentUser.songs) currentUser.songs = [];
     currentUser.songs.push(song);
     userSongs = currentUser.songs;
     
     // Actualizar en IndexedDB y localStorage
     if (db) {
         const transaction = db.transaction(['users'], 'readwrite');
         const store = transaction.objectStore('users');
         store.put(currentUser);
     }
     
     localStorage.setItem('currentUser', JSON.stringify(currentUser));
     
     // Actualizar UI
     renderSongs(userSongs, 'my-music-grid');
     showSection('my-music');
     
     // Resetear formulario
     document.getElementById('upload-form').reset();
 }
 
 // Manejar búsqueda
 function handleSearch(event) {
     const query = event.target.value.toLowerCase();
     let results = [];
     
     if (query.length < 2) {
         if (event.target.id === 'main-search') {
             renderSongs(songs, 'music-grid');
         } else {
             document.getElementById('search-results').innerHTML = '';
         }
         return;
     }
     
     // Buscar en todas las canciones
     const allSongs = [...songs, ...userSongs];
     results = allSongs.filter(song => 
         song.title.toLowerCase().includes(query) ||
         song.artist.toLowerCase().includes(query) ||
         (song.album && song.album.toLowerCase().includes(query))
     );
     
     // Renderizar resultados
     if (event.target.id === 'main-search') {
         renderSongs(results, 'music-grid');
     } else {
         renderSongs(results, 'search-results');
     }
 }
 
 // Abrir modal
 function openModal(type) {
     document.getElementById(`${type}-modal`).style.display = 'block';
 }
 
 // Cerrar modal
 function closeModal(type) {
     document.getElementById(`${type}-modal`).style.display = 'none';
 }
 
 // Mostrar sección
 function showSection(sectionId) {
     // Ocultar todas las secciones
     document.querySelectorAll('.section').forEach(section => {
         section.classList.add('hidden');
     });
     
     // Mostrar la sección seleccionada
     document.getElementById(`${sectionId}-section`).classList.remove('hidden');
     
     // Actualizar menú activo
     document.querySelectorAll('.sidebar li').forEach(item => {
         item.classList.remove('active');
     });
     
     // Encontrar el elemento de menú correspondiente
     const menuItems = document.querySelectorAll('.sidebar li');
     for (let item of menuItems) {
         if (item.textContent.includes(sectionId) || 
             (sectionId === 'home' && item.textContent.includes('Inicio'))) {
             item.classList.add('active');
             break;
         }
     }
 }
 
 // Cerrar sesión
 function logout() {
     currentUser = null;
     localStorage.removeItem('currentUser');
     
     // Actualizar UI
     document.getElementById('user-info').classList.add('hidden');
     document.getElementById('auth-buttons').classList.remove('hidden');
     
     document.getElementById('upload-menu').classList.add('hidden');
     document.getElementById('my-music-menu').classList.add('hidden');
     document.getElementById('playlists-menu').classList.add('hidden');
     
     showSection('home');
 }
 
 // Crear playlist
 function createPlaylist() {
     if (!currentUser) {
         alert('Debes iniciar sesión para crear playlists');
         return;
     }
     
     const playlistName = prompt('Nombre de la playlist:');
     if (!playlistName) return;
     
     const newPlaylist = {
         name: playlistName,
         userId: currentUser.email,
         songs: [],
         cover: 'none'
     };
     
     // En una implementación real, esto sería una llamada AJAX
     if (db) {
         const transaction = db.transaction(['playlists'], 'readwrite');
         const store = transaction.objectStore('playlists');
         const request = store.add(newPlaylist);
         
         request.onsuccess = function(event) {
             newPlaylist.id = event.target.result;
             playlists.push(newPlaylist);
             renderPlaylists();
         };
     } else {
         // Fallback para demo
         newPlaylist.id = Date.now();
         playlists.push(newPlaylist);
         renderPlaylists();
     }
 }
 
 // Renderizar playlists
 function renderPlaylists() {
     const container = document.getElementById('playlists-grid');
     container.innerHTML = '';
     
     playlists.forEach(playlist => {
         const card = document.createElement('div');
         card.className = 'music-card';
         card.innerHTML = `
             <div class="music-info">
                 <h3>${playlist.name}</h3>
                 <p>${playlist.songs.length} canciones</p>
             </div>
             <div class="card-actions">
                 <button class="play-card-btn" onclick="playPlaylist(${playlist.id})">▶️</button>
                 <button class="view-playlist-btn" onclick="viewPlaylist(${playlist.id})">👁️</button>
             </div>
         `;
         container.appendChild(card);
     });
 }
 
 // Reproducir playlist
 function playPlaylist(playlistId) {
     const playlist = playlists.find(p => p.id === playlistId);
     if (!playlist || playlist.songs.length === 0) {
         alert('Esta playlist está vacía');
         return;
     }
     
     currentPlaylist = playlist.songs.map(songId => {
         return songs.find(s => s.id === songId) || userSongs.find(s => s.id === songId);
     }).filter(song => song !== undefined);
     
     currentIndex = 0;
     currentSong = currentPlaylist[0];
     
     playSong(currentSong.id);
 }
 
 // Mostrar modal para agregar a playlist
 function showAddToPlaylistModal(songId) {
     if (!currentUser) {
         alert('Debes iniciar sesión para agregar canciones a playlists');
         return;
     }
     
     // Filtrar playlists del usuario actual
     const userPlaylists = playlists.filter(p => p.userId === currentUser.email);
     
     if (userPlaylists.length === 0) {
         const createNew = confirm('No tienes playlists. ¿Quieres crear una nueva?');
         if (createNew) {
             createPlaylist();
         }
         return;
     }
     
     // Crear modal dinámicamente
     const modal = document.createElement('div');
     modal.className = 'modal';
     modal.id = 'add-to-playlist-modal';
     modal.style.display = 'block';
     
     let modalContent = `
         <div class="modal-content">
             <span class="close" onclick="document.getElementById('add-to-playlist-modal').remove()">&times;</span>
             <h2>Agregar a Playlist</h2>
             <div class="playlist-list">
     `;
     
     userPlaylists.forEach(playlist => {
         modalContent += `
             <div class="playlist-item" onclick="addToPlaylist(${songId}, ${playlist.id})">
                 <h3>${playlist.name}</h3>
                 <p>${playlist.songs.length} canciones</p>
             </div>
         `;
     });
     
     modalContent += `
             </div>
         </div>
     `;
     
     modal.innerHTML = modalContent;
     document.body.appendChild(modal);
 }
 
 // Agregar canción a playlist
 function addToPlaylist(songId, playlistId) {
     const playlist = playlists.find(p => p.id === playlistId);
     if (!playlist) return;
     
     // Verificar si la canción ya está en la playlist
     if (playlist.songs.includes(songId)) {
         alert('Esta canción ya está en la playlist');
         return;
     }
     
     // Agregar canción a la playlist
     playlist.songs.push(songId);
     
     // Actualizar en IndexedDB
     if (db) {
         const transaction = db.transaction(['playlists'], 'readwrite');
         const store = transaction.objectStore('playlists');
         store.put(playlist);
     }
     
     // Cerrar modal
     document.getElementById('add-to-playlist-modal').remove();
     
     // Mostrar confirmación
     alert('Canción agregada a la playlist');
     
     // Actualizar UI si estamos viendo la playlist
     if (document.getElementById('playlist-detail-section') && 
         document.getElementById('playlist-detail-section').dataset.playlistId == playlistId) {
         viewPlaylist(playlistId);
     }
 }
 
 // Ver detalle de playlist
 function viewPlaylist(playlistId) {
     const playlist = playlists.find(p => p.id === playlistId);
     if (!playlist) return;
     
     // Ocultar todas las secciones
     document.querySelectorAll('.section').forEach(section => {
         section.classList.add('hidden');
     });
     
     // Crear o actualizar sección de detalle de playlist
     let detailSection = document.getElementById('playlist-detail-section');
     
     if (!detailSection) {
         detailSection = document.createElement('div');
         detailSection.id = 'playlist-detail-section';
         detailSection.className = 'section';
         document.querySelector('.content-area').appendChild(detailSection);
     }
     
     detailSection.dataset.playlistId = playlistId;
     
     // Contenido de la sección
     detailSection.innerHTML = `
         <div class="playlist-header">
             <button class="btn btn-secondary" onclick="showSection('playlists')">← Volver</button>
             <h2>${playlist.name}</h2>
             <p>${playlist.songs.length} canciones</p>
         </div>
         <div id="playlist-songs" class="music-grid">
             <!-- Las canciones se cargarán dinámicamente -->
         </div>
     `;
     
     // Mostrar la sección
     detailSection.classList.remove('hidden');
     
     // Cargar canciones de la playlist
     const playlistSongs = [];
     
     playlist.songs.forEach(songId => {
         const song = songs.find(s => s.id === songId) || userSongs.find(s => s.id === songId);
         if (song) playlistSongs.push(song);
     });
     
     renderSongs(playlistSongs, 'playlist-songs');
 }