import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../services/AuthContext';
import './Videos.css';
import { confirmModal } from '../Toast/ConfirmationModal';
import { toast } from '../Toast/Toast';

interface Video {
  id: number;
  url: string;
  title: string;
  author: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  size: string;
}

const AnimatedCard: React.FC<{ children: React.ReactNode; index: number }> = ({ children, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        setIsVisible(entry.isIntersecting);
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '20px',
    });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`video-card ${isVisible ? 'animate-in' : 'animate-out'}`}
      style={{
        '--delay': `${index * 0.1}s`,
        '--index': index,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

const Videos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  // Estado para controlar la visibilidad del panel de burbujas de progreso
  const [showProgressBubbles, setShowProgressBubbles] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHeaderVisible(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://wedding-back-bkutww.fly.dev/api/upload-files/videos');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener los videos');
        }
        
        const data = await response.json();
        
        // Check if data.videos exists and is an array before mapping
        if (data && data.videos && Array.isArray(data.videos)) {
          const videosList = data.videos.map((fileName: string, index: number) => {
            const parts = fileName.split('_');
            const title = (parts[0] || 'Sin título').replace(/-/g, ' ');
            const author = (parts[1] || 'Desconocido').replace(/-/g, ' ');
            return {
              id: index + 1,
              url: `https://wedding-back-bkutww.fly.dev/api/uploads/videos/${fileName}`,
              title,
              author,
            };
          });
          setVideos(videosList);
        } else {
          // Handle the case where data.videos is undefined or not an array
          setVideos([]);
          console.error('No videos data found or invalid format:', data);
        }
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast.error(errMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (files: File[]) => {
    const validVideos = files.filter(file => file.type.startsWith('video/'));
    setSelectedFiles(validVideos);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !title || !author) return;

    try {
      setUploading(true);
      setShowProgressBubbles(true); // Mostrar las burbujas de progreso
      
      // Initialize progress tracking for each file
      const initialProgress = selectedFiles.map(file => ({
        fileName: file.name,
        progress: 0,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }));
      setUploadProgress(initialProgress);
      
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
  
      formData.append('uploadedBy', author);
      formData.append('title', title);
      
      // Use XMLHttpRequest instead of fetch to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          
          // Update progress for all files (distributing progress evenly)
          setUploadProgress(prev => 
            prev.map(item => ({
              ...item,
              progress: percentComplete
            }))
          );
        }
      });
      
      xhr.onload = async function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          
          const newVideos: Video[] = result.files.map((fileName: string, index: number) => ({
            id: videos.length + index + 1,
            url: `https://wedding-back-bkutww.fly.dev/api/uploads/videos/${fileName}`,
            title: title,
            author: author,
          }));
      
          setVideos((prevVideos) => [...prevVideos, ...newVideos]);
          
          // Clear form after successful upload
          setTimeout(() => {
            setShowUploadForm(false);
            setSelectedFiles([]);
            setTitle('');
            setAuthor('');
            setUploadProgress([]);
            setUploading(false);
            // Ocultamos las burbujas de progreso después de un tiempo
            setTimeout(() => {
              setShowProgressBubbles(false);
            }, 1500);
          }, 1000); // Delay to let user see 100% completion
          
          toast.success('Videos subidos correctamente');
        } else {
          const errorData = JSON.parse(xhr.responseText);
          throw new Error(errorData.message || 'Error desconocido al subir los videos');
        }
      };
      
      xhr.onerror = function() {
        throw new Error('Error de red al intentar subir los videos');
      };
      
      xhr.open('POST', 'https://wedding-back-bkutww.fly.dev/api/upload-files/files', true);
      xhr.send(formData);
  
    } catch (error: unknown) { 
      const errMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errMessage);
      setUploading(false);
      setShowProgressBubbles(false); // Ocultar las burbujas en caso de error
    }
  };

  const handleDelete = (video: Video) => {
    confirmModal.warning(
      "¿Estás seguro/a de eliminar este video?",
      async () => {
        try {
          const fileName = video.url.split('/').pop();
          if (!fileName) {
            throw new Error('No se pudo extraer el nombre del archivo');
          }
  
          const response = await fetch('https://wedding-back-bkutww.fly.dev/api/upload-files/remove/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName }),
          });
  
          const result = await response.json();
  
          if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar el video');
          }
  
          setVideos((prevVideos) => prevVideos.filter((v) => v.id !== video.id));
  
          toast.success('Video eliminado correctamente');
  
        } catch (error: unknown) {
          const errMessage = error instanceof Error ? error.message : 'Error desconocido';
          toast.error(errMessage);
        }
      },
      () => {},
      "Eliminar",
      "Cancelar",
      "Confirmar eliminación"
    );
  };  

  const downloadVideo = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlParts = url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0];
      const filename = `${title}.${extension}`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      toast.success('Video descargado correctamente');
  
    } catch (error) {
      console.error('Error al descargar el video:', error);
      toast.error('Error al descargar el video');
    }
  };
  
  const shareVideoFile = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlParts = url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'mp4';
      const fileName = `${title}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type });
  
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          text: '¡Mira este video increíble!',
          files: [file],
        });
  
      } else {
        openFileShare(blob, fileName);
      }
    } catch (error) {
      toast.error('No se pudo compartir el video. Intenta descargarlo manualmente.');
    }
  };  

  const openFileShare = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('El video se ha guardado en tu computadora. Ahora puedes compartirlo manualmente.');
  };

  const toggleUploadForm = () => {
    if (uploading) return; // Prevent closing form while uploading
    
    setShowUploadForm(!showUploadForm);
    if (!showUploadForm) {
      setSelectedFiles([]);
      setTitle('');
      setAuthor('');
      setUploadProgress([]);
    }
  };

  return (
    <div className="videos-container">
      <div
        ref={headerRef}
        className={`videos-header ${headerVisible ? 'header-visible' : 'header-hidden'}`}
      >
        <h1>Galería de Videos</h1>
        <p>Descubre impresionantes videos compartidos por nuestra comunidad</p>

        <div className="upload-button-container">
          <button 
            onClick={toggleUploadForm} 
            className="upload-btn"
            disabled={uploading}
          >
            {showUploadForm ? 'Cancelar' : 'Subir videos'}
          </button>
        </div>
      </div>

      {/* Panel de burbujas de progreso en el lado derecho */}
      {showProgressBubbles && uploadProgress.length > 0 && (
        <div className="progress-bubbles-container">
          <div className="progress-bubbles-header">
            <h3>Subiendo {uploadProgress.length} {uploadProgress.length === 1 ? 'video' : 'videos'}</h3>
            <button 
              className="minimize-progress-btn"
              onClick={() => setShowProgressBubbles(false)}
            >
              <MinimizeIcon />
            </button>
          </div>
          {uploadProgress.map((file, index) => (
            <div key={index} className="progress-bubble">
              <div className="progress-bubble-info">
                <div className="progress-bubble-name-container">
                  <FileVideoIcon />
                  <span className="progress-bubble-name">
                    {file.fileName.length > 20 
                      ? file.fileName.slice(0, 17) + '...' 
                      : file.fileName}
                  </span>
                </div>
                <span className="progress-bubble-percentage">{Math.round(file.progress)}%</span>
              </div>
              <div className="progress-bubble-bar-bg">
                <div 
                  className="progress-bubble-bar-fill" 
                  style={{ width: `${file.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadForm && !uploading && (
        <div className="upload-form-container">
          <form onSubmit={handleUpload} className="upload-form">
            <div 
              className={`dropzone ${dragActive ? 'active' : ''}`} 
              onDragEnter={handleDrag} 
              onDragLeave={handleDrag} 
              onDragOver={handleDrag} 
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-content">
                {selectedFiles.length > 0 ? (
                  <div className="selected-files">
                    <p>{selectedFiles.length} {selectedFiles.length === 1 ? 'video seleccionado' : 'videos seleccionados'}</p>
                    <ul>
                      {selectedFiles.map((file, index) => (
                        <li key={index}>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <>
                    <p>Arrastra y suelta videos aquí o</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="select-file-button">
                      Selecciona archivos
                    </button>
                    <p className="file-info">MP4, MOV, AVI hasta 100MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                accept="video/*"
                multiple
                onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
              />
            </div>

            <div className="form-fields">
              <div className="form-group">
                <label>Título del video</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Autor</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={toggleUploadForm} className="cancel-button">Cancelar</button>
              <button 
                type="submit" 
                disabled={uploading || selectedFiles.length === 0 || !title || !author} 
                className="submit-button"
              >
                {uploading ? 'Subiendo...' : 'Subir videos'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Cargando videos...</p>
        </div>
      ) : (
        <div className="videos-grid">
          {videos.map((video, index) => (
            <AnimatedCard key={video.id} index={index}>
              <div className="video-player">
                <video controls preload="metadata">
                  <source src={video.url} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
              <div className="video-info">
                <h3>{video.title}</h3>
                <p>Por: {video.author}</p>
                <div className="video-actions">
                  <button
                    className="action-btn download-btn"
                    aria-label="Descargar"
                    onClick={() => downloadVideo(video.url, video.title)}
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    className="action-btn share-btn"
                    aria-label="Compartir"
                    onClick={() => shareVideoFile(video.url, video.title)}
                  >
                    <ShareIcon />
                  </button>
                  {isAuthenticated && (
                    <button
                      className="action-btn delete-btn"
                      aria-label="Eliminar"
                      onClick={() => handleDelete(video)}
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <svg
    className="spinner"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path
      className="spinner-head"
      d="M12 2C6.47715 2 2 6.47715 2 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const MinimizeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FileVideoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M10 11l5 3-5 3v-6z" />
  </svg>
);

export default Videos;