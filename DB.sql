-- Base de datos para la plataforma de streaming de música
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS music_platform;
USE music_platform;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de canciones
CREATE TABLE canciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    artista VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    duracion INT, -- duracion en segundos
    archivo_audio VARCHAR(500) NOT NULL, -- ruta del archivo MP3
    imagen_portada VARCHAR(500), -- ruta de la imagen de portada
    usuario_id INT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reproducciones INT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de playlists
CREATE TABLE playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    usuario_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publica BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla relacional playlist-canciones
CREATE TABLE playlist_canciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    cancion_id INT NOT NULL,
    orden INT DEFAULT 0,
    fecha_agregada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE,
    UNIQUE KEY unique_playlist_cancion (playlist_id, cancion_id)
);

-- Tabla de reproducciones recientes
CREATE TABLE reproducciones_recientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cancion_id INT NOT NULL,
    fecha_reproduccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE
);

-- Insertar datos de ejemplo
INSERT INTO usuarios (nombre, email, password) VALUES 
('Admin', 'admin@musicplatform.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password
('Usuario Demo', 'demo@musicplatform.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- password

INSERT INTO canciones (titulo, artista, album, duracion, archivo_audio, imagen_portada, usuario_id) VALUES 
('Canción Demo 1', 'Artista Demo', 'Album Demo', 180, 'uploads/demo1.mp3', 'uploads/cover1.jpg', 1),
('Canción Demo 2', 'Artista Demo 2', 'Album Demo 2', 210, 'uploads/demo2.mp3', 'uploads/cover2.jpg', 1);

INSERT INTO playlists (nombre, descripcion, usuario_id, publica) VALUES 
('Mi Playlist Favorita', 'Mis canciones favoritas de todos los tiempos', 1, TRUE),
('Música para Estudiar', 'Canciones relajantes para concentrarse', 1, FALSE);

INSERT INTO playlist_canciones (playlist_id, cancion_id, orden) VALUES 
(1, 1, 1),
(1, 2, 2),
(2, 1, 1);