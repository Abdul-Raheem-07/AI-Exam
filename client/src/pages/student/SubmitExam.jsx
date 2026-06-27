import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2 } from 'lucide-react';

const SubmitExam = () => {
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [exam, setExam] = useState(null);

  const { id: examId } = useParams();
  const navigate = useNavigate();

  // Fetch exam details
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await axios.get(`/exams/${examId}`);
        setExam(data);
      } catch (error) {
        console.error('Failed to load exam', error);
      }
    };

    fetchExam();
  }, [examId]);

  // Cleanup memory leaks
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const toastId = toast.loading('Compressing images...');

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFiles = await Promise.all(
        acceptedFiles.map((file) => imageCompression(file, options))
      );

      const newImages = compressedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...newImages]);

      toast.success('Images ready for upload', { id: toastId });
    } catch (error) {
      toast.error('Image processing failed', { id: toastId });
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
    if (!images.length) {
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
      navigate(`/student/submission/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Upload Answer Sheets
          </h1>

          {exam && (
            <p className="text-blue-600 font-medium mt-1">
              {exam.title}
            </p>
          )}

          <p className="text-gray-600 mt-2">
            Upload clear, well-lit images of your handwritten answers.
          </p>
        </div>

        {/* Questions Preview */}
        {exam?.questions?.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">
              Exam Questions
            </h3>

            <div className="space-y-3">
              {exam.questions.map((q, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 border border-blue-100"
                >
                  <p className="font-medium text-gray-800">
                    Q{index + 1}. {q.questionText}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Marks: {q.maxMarks}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />

          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />

          {isDragActive ? (
            <p className="text-blue-600 font-medium">
              Drop images here...
            </p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium">
                Drag & drop answer sheets here
              </p>
              <p className="text-gray-500 text-sm mt-1">
                or click to select files (auto-compressed)
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        {images.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Selected Images ({images.length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={img.preview}
                    alt="preview"
                    className="w-full h-32 object-cover"
                  />

                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={!images.length || isUploading}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition ${
              !images.length || isUploading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Uploading...
              </>
            ) : (
              `Submit Answers (${images.length})`
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubmitExam;