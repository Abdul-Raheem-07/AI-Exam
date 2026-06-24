import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2 } from 'lucide-react';

const SubmitExam = () => {
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles) => {
    toast.loading('Compressing images...', { id: 'compress' });
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFilesPromises = acceptedFiles.map((file) => imageCompression(file, options));
      const compressedFiles = await Promise.all(compressedFilesPromises);
      
      const newImages = compressedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...newImages]);
      toast.success('Images compressed', { id: 'compress' });
    } catch (error) {
      toast.error('Error compressing images', { id: 'compress' });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  });

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('examId', examId);
    
    images.forEach((img) => {
      formData.append('images', img.file);
    });

    try {
      const { data } = await axios.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Submission successful!');
      navigate(`/student/submission/${data._id}`); // Navigate to processing/status screen
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Answer Sheets</h1>
        <p className="text-gray-600 mb-6">Upload clear, well-lit images of your handwritten answers.</p>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop the images here...</p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium">Drag & drop your answer sheet images here</p>
              <p className="text-gray-500 text-sm mt-1">or click to select files (auto-compressed before upload)</p>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Images ({images.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                  <img src={img.preview} alt={`Preview ${index}`} className="w-full h-32 object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                    {img.file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={images.length === 0 || isUploading}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (images.length === 0 || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Uploading...
              </>
            ) : (
              'Submit Answers'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitExam;
