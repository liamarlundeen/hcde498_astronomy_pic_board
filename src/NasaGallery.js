import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import './NasaGallery.css';

const NasaGallery = () => {
  const [apodData, setApodData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [savedImages, setSavedImages] = useState([]);
  const [dateSubmitted, setDateSubmitted] = useState(false);
  const [isRange, setIsRange] = useState(false);

  const API_KEY = process.env.REACT_APP_NASA_API_KEY;

  const loadSavedImages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'savedImages'));
      const images = [];
      querySnapshot.forEach((doc) => {
        images.push({ ...doc.data(), id: doc.id });
      });
      setSavedImages(images);
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  };

  useEffect(() => {
    loadSavedImages();
  }, []);

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (startDate) {
        if (isRange && endDate) {
          validateDateRange(startDate, endDate);
          setDateSubmitted(true);
          await fetchDateRange();
        } else {
          setDateSubmitted(true);
          await fetchSingleDate();
        }
      }
    } catch (err) {
      setError(err.message);
      // Reset any existing data
      setApodData([]);
      setDateSubmitted(false);
    }
  };

  const fetchSingleDate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${startDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch APOD');
      const data = await response.json();
      setApodData([data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateRange = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch APOD');
      const data = await response.json();
      setApodData(data.reverse());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) {
      throw new Error('Date range cannot be more than one month apart');
    }
  };

  const saveToGallery = async (image) => {
    try {
      const imageData = {
        ...image,
        savedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'savedImages'), imageData);
      await loadSavedImages();
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save image');
    }
  };

  const removeFromGallery = async (imageId) => {
    try {
      await deleteDoc(doc(db, 'savedImages', imageId));
      await loadSavedImages();
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image');
    }
  };

  const resetDate = () => {
    setDateSubmitted(false);
    setStartDate('');
    setEndDate('');
    setApodData([]);
    setError(null);
  };

  return (
    <div className="page-container">
      <div className="content-container">
        <h1 className="main-title">NASA Astronomy Picture of the Day</h1>
        
        {/* Date Selection - Always visible */}
        <div className="date-selection-container">
          <h2>Select Dates</h2>
          <div className="date-mode-toggle">
            <button 
              className={`toggle-button ${!isRange ? 'active' : ''}`}
              onClick={() => {
                setIsRange(false);
                setEndDate('');
              }}
            >
              Single Date
            </button>
            <button 
              className={`toggle-button ${isRange ? 'active' : ''}`}
              onClick={() => setIsRange(true)}
            >
              Date Range
            </button>
          </div>
          <form onSubmit={handleDateSubmit} className="date-form">
            {isRange ? (
              <div className="date-inputs">
                <div className="date-input-group">
                  <label htmlFor="start-date">Start Date:</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    min="1995-06-16"
                    max={endDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                    required
                  />
                </div>
                <div className="date-input-group">
                  <label htmlFor="end-date">End Date:</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate || "1995-06-16"}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="date-input-group">
                <label htmlFor="single-date">Date:</label>
                <input
                  id="single-date"
                  type="date"
                  value={startDate}
                  min="1995-06-16"
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                  required
                />
              </div>
            )}
            <button type="submit" className="submit-button">
              View {isRange ? 'Images' : 'Image'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : apodData.length > 0 && (
          <div className="images-section">
            <h2 className="results-title">
              {isRange 
                ? `Showing ${apodData.length} images from ${startDate} to ${endDate}`
                : `Showing image for ${startDate}`}
            </h2>
            <div className="images-grid">
              {apodData.map((image) => (
                <div key={image.date} className="image-card">
                  <div className="image-header">
                    <h3>{image.title}</h3>
                    <p className="date">{image.date}</p>
                  </div>
                  <div className="media-container">
                    {image.media_type === 'video' ? (
                      <iframe
                        src={image.url}
                        title={image.title}
                        className="media"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={image.url}
                        alt={image.title}
                        className="media"
                      />
                    )}
                  </div>
                  <p className="explanation">{image.explanation}</p>
                  <button 
                    onClick={() => saveToGallery(image)}
                    disabled={savedImages.some(img => img.date === image.date)}
                    className="save-button"
                  >
                    {savedImages.some(img => img.date === image.date) 
                      ? 'Saved to Gallery' 
                      : 'Save to Gallery'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section - Always visible */}
        <div className="gallery-section">
          <h2>Your Gallery</h2>
          {savedImages.length > 0 ? (
            <div className="gallery-grid">
              {savedImages.map((image) => (
                <div key={image.id} className="gallery-item">
                  <h3>{image.title}</h3>
                  <p className="date">{image.date}</p>
                  <div className="media-container">
                    {image.media_type === 'video' ? (
                      <iframe
                        src={image.url}
                        title={image.title}
                        className="gallery-media"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={image.url}
                        alt={image.title}
                        className="gallery-media"
                      />
                    )}
                  </div>
                  <button 
                    onClick={() => removeFromGallery(image.id)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-gallery">No images saved yet. Save some images to see them here!</p>
          )}
        </div>
      </div>
      <div className="footer">
          <p>Created with NASA's APOD API 💫</p>
      </div>
    </div>
  );
};

export default NasaGallery;