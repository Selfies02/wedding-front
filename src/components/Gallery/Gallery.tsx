import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../services/AuthContext';
import './Gallery.css';
import { confirmModal } from '../Toast/ConfirmationModal';
import { toast } from '../Toast/Toast';

interface Photo {
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

const BASE_URL = "http://3.128.170.227";

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
      className={`photo-card ${isVisible ? 'animate-in' : 'animate-out'}`}
      style={{
        '--delay': `${index * 0.1}s`,
        '--index': index,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
  const [showProgressBubbles, setShowProgressBubbles] = useState(false);

  // Estado para la imagen seleccionada (para modal)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/api/upload-files/photos`);
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener las fotos');
        }
        
        const data = await response.json();
        
        if (data && data.photos && Array.isArray(data.photos)) {
          const photosList = data.photos.map((fileName: string, index: number) => {
            const parts = fileName.split('_');
            const title = (parts[0] || 'Sin título').replace(/-/g, ' ');
            const author = (parts[1] || 'Desconocido').replace(/-/g, ' ');
            return {
              id: index + 1,
              url: `${BASE_URL}/uploads/photos/${fileName}`,
              title,
              author,
            };
          });
          setPhotos(photosList);
        } else {
          setPhotos([]);
          console.error('No photos data found or invalid format:', data);
        }
      } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast.error(errMessage);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPhotos();
  }, []);  

  // Detecta si es un dispositivo móvil
  const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleDrag = (e: React.DragEvent) => {
    if (isMobile()) return; // Desactiva drag & drop en móviles
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isMobile()) return; // Desactiva drag & drop en móviles
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (files: File[]) => {
    // Conservar archivos existentes y agregar nuevos
    const validImages = [...selectedFiles, ...files.filter(file => file.type.startsWith('image/'))];
    
    const newPreviews = validImages.map(file => 
      selectedFiles.includes(file) 
        ? previews[selectedFiles.indexOf(file)] 
        : URL.createObjectURL(file)
    );
    
    setSelectedFiles(validImages);
    setPreviews(newPreviews);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !title || !author) return;

    try {
      setUploading(true);
      setShowProgressBubbles(true);
      
      // Inicializar progreso para cada archivo
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
      
      // Usar XMLHttpRequest para rastrear el progreso
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
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
          
          const newPhotos: Photo[] = result.files.map((fileName: string, index: number) => ({
            id: photos.length + index + 1,
            url: `${BASE_URL}/uploads/photos/${fileName}`,
            title,
            author,
          }));
      
          setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
          
          // Limpiar formulario tras subida exitosa con un retraso para Safari
          setTimeout(() => {
            setShowUploadForm(false);
            // Retrasar la revocación de los blob URLs para evitar el error en Safari
            previews.forEach(url => URL.revokeObjectURL(url));
            setSelectedFiles([]);
            setPreviews([]);
            setTitle('');
            setAuthor('');
            setUploadProgress([]);
            setUploading(false);
            setTimeout(() => {
              setShowProgressBubbles(false);
            }, 1500);
          }, 2000);
          
          toast.success('Imágenes subidas correctamente');
        } else {
          const errorData = JSON.parse(xhr.responseText);
          throw new Error(errorData.message || 'Error desconocido al subir las imágenes');
        }
      };
      
      xhr.onerror = function() {
        throw new Error('Error de red al intentar subir las imágenes');
      };
      
      xhr.open('POST', `${BASE_URL}/api/upload-files/files`, true);
      xhr.send(formData);
  
    } catch (error: unknown) { 
      const errMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errMessage);
      setUploading(false);
      setShowProgressBubbles(false);
    }
  };  

  const handleDelete = (photo: Photo) => {
    confirmModal.warning(
      "¿Estás seguro/a de eliminar esta foto?",
      async () => {
        try {
          const fileName = photo.url.split('/').pop();
          if (!fileName) {
            throw new Error('No se pudo extraer el nombre del archivo');
          }
  
          const response = await fetch(`${BASE_URL}/api/upload-files/remove/photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName }),
          });
  
          const result = await response.json();
  
          if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar la foto');
          }
  
          setPhotos((prevPhotos) => prevPhotos.filter((p) => p.id !== photo.id));
          toast.success('Foto eliminada correctamente');
  
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

  const downloadImage = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlParts = url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0];
      const filename = `${title}.${extension}`;
      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      // Retrasar la revocación del blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 1000);
      toast.success('Imagen descargada correctamente');
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      toast.error('Error al descargar la imagen');
    }
  };
  
  const shareImageFile = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlParts = url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
      const fileName = `${title}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type });
  
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text: '¡Mira esta imagen increíble!',
          files: [file],
        });
      } else {
        openFileShare(blob, fileName);
      }
    } catch (error) {
      toast.error('No se pudo compartir la imagen. Intenta descargarla manualmente.');
    }
  };  

  const openFileShare = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('La imagen se ha guardado en tu computadora. Ahora puedes compartirla manualmente.');
  };

  const toggleUploadForm = () => {
    if (uploading) return;
    setShowUploadForm(prev => {
      if (prev) {
        // Al cerrar, limpiar previews y archivos seleccionados
        previews.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviews([]);
        setTitle('');
        setAuthor('');
        setUploadProgress([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      return !prev;
    });
  };

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div className="gallery-container">
      <div
        ref={headerRef}
        className={`gallery-header ${headerVisible ? 'header-visible' : 'header-hidden'}`}
      >
        <h1>Galería de Fotografías</h1>
        <p>Descubre impresionantes imágenes compartidas por nuestra comunidad</p>
        <div className="upload-button-container">
          <button onClick={toggleUploadForm} className="upload-btn" disabled={uploading}>
            {showUploadForm ? 'Cancelar' : 'Subir imágenes'}
          </button>
        </div>
      </div>

      {showProgressBubbles && uploadProgress.length > 0 && (
        <div className="progress-bubbles-container">
          <div className="progress-bubbles-header">
            <h3>
              Subiendo {uploadProgress.length} {uploadProgress.length === 1 ? 'imagen' : 'imágenes'}
            </h3>
            <button className="minimize-progress-btn" onClick={() => setShowProgressBubbles(false)}>
              <MinimizeIcon />
            </button>
          </div>
          {uploadProgress.map((file, index) => (
            <div key={index} className="progress-bubble">
              <div className="progress-bubble-info">
                <div className="progress-bubble-name-container">
                  <FileImageIcon />
                  <span className="progress-bubble-name">
                    {file.fileName.length > 20 ? file.fileName.slice(0, 17) + '...' : file.fileName}
                  </span>
                </div>
                <span className="progress-bubble-percentage">{Math.round(file.progress)}%</span>
              </div>
              <div className="progress-bubble-bar-bg">
                <div className="progress-bubble-bar-fill" style={{ width: `${file.progress}%` }}></div>
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
                {previews.length > 0 ? (
                  <div className="preview-grid">
                    {previews.map((preview, index) => (
                      <div key={index} className="preview-container">
                        <img src={preview} alt={`Preview ${index}`} className="image-preview" />
                        <button
                          className="remove-preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePreview(index);
                          }}
                          title="Eliminar imagen"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p>Arrastra y suelta imágenes aquí o</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="select-file-button"
                    >
                      Selecciona archivos
                    </button>
                    <p className="file-info">PNG, JPG, JPEG</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="file-input"
                onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
              />
            </div>

            <div className="form-fields">
              <div className="form-group">
                <label>Título de la imagen</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Autor</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={toggleUploadForm} className="cancel-button">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || selectedFiles.length === 0 || !title || !author}
                className="submit-button"
              >
                {uploading ? 'Subiendo...' : 'Subir imágenes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Cargando imágenes...</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map((photo, index) => (
            <AnimatedCard key={photo.id} index={index}>
              <div 
                className="photo-image" 
                onClick={() => setSelectedPhoto(photo)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={photo.url} 
                  alt={photo.title} 
                  loading="lazy" 
                />
              </div>
              <div className="photo-info">
                <h3>{photo.title}</h3>
                <p>Por: {photo.author}</p>
                <div className="photo-actions">
                  <button
                    className="action-btn download-btn"
                    aria-label="Descargar"
                    onClick={() => downloadImage(photo.url, photo.title)}
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    className="action-btn share-btn"
                    aria-label="Compartir"
                    onClick={() => shareImageFile(photo.url, photo.title)}
                  >
                    <ShareIcon />
                  </button>
                  {isAuthenticated && (
                    <button
                      className="action-btn delete-btn"
                      aria-label="Eliminar"
                      onClick={() => handleDelete(photo)}
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

      {/* Modal para ver la imagen en tamaño original */}
      {selectedPhoto && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="close-modal" 
              onClick={() => setSelectedPhoto(null)}
            >
              ×
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title} 
              className="full-size-image" 
            />
          </div>
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

const FileImageIcon = () => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default Gallery;
