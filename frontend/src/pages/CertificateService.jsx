import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Upload, Download, ArrowLeft, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function CertificateService() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState({
    name: { enabled: true, x: 400, y: 350, color: '#000000', fontSize: 48 },
    role: { enabled: true, x: 400, y: 450, color: '#333333', fontSize: 32 },
    organization: { enabled: true, x: 400, y: 250, color: '#000000', fontSize: 36 },
    date: { enabled: true, x: 400, y: 550, color: '#666666', fontSize: 24 },
    qr: { enabled: true, x: 50, y: 50, size: 100 }
  });
  const [draggedField, setDraggedField] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [generatedCertificates, setGeneratedCertificates] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const processTemplateFile = (file) => {
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error('Only PNG and JPG images are allowed');
      return;
    }

    setTemplateFile(file);
    const previewUrl = URL.createObjectURL(file);
    setTemplatePreview(previewUrl);
    toast.success('Template loaded successfully!');
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    processTemplateFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    processTemplateFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleImageClick = (e) => {
    if (!draggedField) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    setPositions({
      ...positions,
      [draggedField]: {
        ...positions[draggedField],
        x: x,
        y: y
      }
    });
    
    toast.success(`${draggedField} positioned at (${x}, ${y})`);
    setDraggedField(null);
  };

  const handleGenerateCertificates = async () => {
    if (!csvFile) {
      toast.error('Please upload a CSV file');
      return;
    }

    if (!organizationName.trim()) {
      toast.error('Please enter your organization name');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('template', templateFile);
      formData.append('csv', csvFile);
      formData.append('organization', organizationName);
      formData.append('positions', JSON.stringify(positions));

      const token = localStorage.getItem('session_token');
      const response = await axios.post(`${API_URL}/certificates/standalone/generate`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setGeneratedCertificates(response.data.certificates || []);
      toast.success(
        <div>
          <div className="font-semibold">Certificates Generated!</div>
          <div className="text-sm mt-1">
            {response.data.certificates_generated} certificates created successfully
          </div>
        </div>,
        { duration: 5000 }
      );
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csv = `Name,Email,Role\nJohn Doe,john@example.com,Participant\nJane Smith,jane@example.com,Speaker\nBob Wilson,bob@example.com,Volunteer`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllCertificates = () => {
    generatedCertificates.forEach((cert, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = cert.certificate_url;
        link.download = `Certificate_${cert.user_name.replace(/\s+/g, '_')}.png`;
        link.click();
      }, index * 200);
    });
    toast.success('Downloading all certificates...');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/organizer')} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <Award className="w-8 h-8 text-teal-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Certificate Service</h1>
                <p className="text-xs text-gray-400">Generate certificates for any event or purpose</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-400'}`}>
                {s === 1 ? 'Template' : s === 2 ? 'Position' : 'Generate'}
              </span>
              {s < 3 && <div className="w-16 h-0.5 bg-gray-700"></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Template */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto">
            <Card className="glass-effect p-8 border border-gray-800">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Upload Certificate Template</h2>
                <p className="text-gray-400 mb-8">Upload a PNG or JPG image as your certificate background</p>
                
                {/* Drag and Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-12 mb-6 transition-all ${
                    isDragging 
                      ? 'border-teal-500 bg-teal-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleTemplateUpload}
                    className="hidden"
                  />
                  
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  
                  <div className="text-gray-400 mb-4">
                    {isDragging ? (
                      <p className="text-teal-400 font-medium text-lg">Drop your template here</p>
                    ) : (
                      <>
                        <p className="text-lg mb-2">Drag and drop your certificate template here</p>
                        <p className="text-sm text-gray-500">or</p>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Template Image
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    Supported formats: PNG, JPG, JPEG • Recommended: 1920x1080px
                  </p>
                </div>

                {templatePreview && (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-sm text-green-400">Template uploaded successfully</p>
                    </div>
                    <img src={templatePreview} alt="Template Preview" className="max-w-full h-auto rounded-lg border border-gray-700 mb-6" />
                    
                    <Button 
                      onClick={() => setStep(2)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                    >
                      Continue to Positioning
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Position Fields */}
        {step === 2 && templatePreview && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="glass-effect p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Position Certificate Fields</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {draggedField ? 
                        `Click on template to place "${draggedField}"` : 
                        'Enable fields and click to position them'
                      }
                    </p>
                  </div>
                </div>
                <div className="relative border-2 border-dashed border-gray-700 rounded-lg overflow-hidden bg-gray-900/30"
                     style={{ cursor: draggedField ? 'crosshair' : 'default' }}>
                  <img 
                    src={templatePreview} 
                    alt="Template"
                    className="w-full h-auto"
                    onClick={handleImageClick}
                    style={{ display: 'block' }}
                  />
                  {/* Position Indicators - Only show enabled fields */}
                  {Object.keys(positions).filter(field => positions[field].enabled).map((field) => (
                    <div
                      key={field}
                      style={{
                        position: 'absolute',
                        left: `${positions[field].x}px`,
                        top: `${positions[field].y}px`,
                        transform: 'translate(-50%, -50%)',
                        padding: '6px 12px',
                        background: draggedField === field ? 'rgba(20, 184, 166, 1)' : 'rgba(20, 184, 166, 0.9)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        border: `2px solid ${draggedField === field ? '#0d9488' : '#14b8a6'}`,
                        boxShadow: draggedField === field ? '0 4px 12px rgba(20, 184, 166, 0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {field.toUpperCase()}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card className="bg-white p-4 border border-gray-300 sticky top-4 max-h-[80vh] overflow-y-auto shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Certificate Fields</h3>
                
                <div className="space-y-3 mb-6">
                  {Object.keys(positions).map((field) => (
                    <div key={field} className="bg-gray-50 rounded-lg p-3 border-2 border-gray-300 hover:border-teal-400 transition-colors">
                      {/* Field Header with Toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={positions[field].enabled}
                              onChange={(e) => {
                                setPositions({
                                  ...positions,
                                  [field]: { ...positions[field], enabled: e.target.checked }
                                });
                                if (!e.target.checked && draggedField === field) {
                                  setDraggedField(null);
                                }
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                          </label>
                          <span className="text-gray-900 font-medium capitalize">{field}</span>
                        </div>
                        {positions[field].enabled && (
                          <Award className={`w-4 h-4 ${draggedField === field ? 'text-teal-600' : 'text-gray-600'}`} />
                        )}
                      </div>

                      {/* Field Controls - Only show if enabled */}
                      {positions[field].enabled && (
                        <div className="space-y-2">
                          {/* Position Button */}
                          <Button
                            size="sm"
                            onClick={() => {
                              setDraggedField(field);
                              toast.info(`Click on template to place "${field}"`);
                            }}
                            className={`w-full text-xs ${
                              draggedField === field
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            }`}
                          >
                            {draggedField === field ? '📍 Positioning...' : 'Set Position'}
                          </Button>

                          {/* Position Display */}
                          <div className="text-xs text-gray-600">
                            Position: ({positions[field].x}, {positions[field].y})
                          </div>

                          {/* Font Size Control (not for QR) */}
                          {field !== 'qr' && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600">Size:</label>
                              <input
                                type="range"
                                min="12"
                                max="72"
                                value={positions[field].fontSize}
                                onChange={(e) => {
                                  setPositions({
                                    ...positions,
                                    [field]: { ...positions[field], fontSize: parseInt(e.target.value) }
                                  });
                                }}
                                className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-xs text-gray-600 w-8">{positions[field].fontSize}px</span>
                            </div>
                          )}

                          {/* QR Size Control */}
                          {field === 'qr' && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600">Size:</label>
                              <input
                                type="range"
                                min="50"
                                max="200"
                                value={positions[field].size}
                                onChange={(e) => {
                                  setPositions({
                                    ...positions,
                                    [field]: { ...positions[field], size: parseInt(e.target.value) }
                                  });
                                }}
                                className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-xs text-gray-600 w-8">{positions[field].size}px</span>
                            </div>
                          )}

                          {/* Color Control (not for QR) */}
                          {field !== 'qr' && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600">Color:</label>
                              <input
                                type="color"
                                value={positions[field].color}
                                onChange={(e) => {
                                  setPositions({
                                    ...positions,
                                    [field]: { ...positions[field], color: e.target.value }
                                  });
                                }}
                                className="w-8 h-8 rounded cursor-pointer"
                              />
                              <span className="text-xs text-gray-600 font-mono">{positions[field].color}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={() => setStep(3)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Continue to Generation
                </Button>
                
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Change Template
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Generate Certificates */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="glass-effect p-6 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-4">Generate Certificates</h2>
              
              {/* Event Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., AI Workshop 2024, Tech Conference, Training Program"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This event name will appear on all certificates. Users can retrieve their certificates using this event name.
                </p>
              </div>

              {/* CSV Upload */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-2">CSV Format Required:</p>
                    <code className="text-xs text-blue-200 bg-blue-950/50 px-2 py-1 rounded">
                      Name, Email, Role
                    </code>
                    <p className="text-blue-300 text-xs mt-2">
                      Example roles: Participant, Speaker, Volunteer, Winner, etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <label className="flex-1 cursor-pointer">
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCsvFile(file);
                        toast.success(`CSV file "${file.name}" loaded`);
                      }
                    }}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => csvInputRef.current?.click()}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {csvFile ? csvFile.name : 'Upload CSV File'}
                  </Button>
                </label>
                
                <Button
                  variant="outline"
                  onClick={downloadSampleCsv}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Sample CSV
                </Button>
              </div>

              <Button
                onClick={handleGenerateCertificates}
                disabled={loading || !csvFile || !organizationName.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg py-6"
              >
                {loading ? (
                  'Generating Certificates...'
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Generate Certificates
                  </>
                )}
              </Button>
            </Card>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && generatedCertificates.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <Card className="glass-effect p-8 border border-gray-800">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Certificates Generated!</h2>
                <p className="text-gray-400">Successfully generated {generatedCertificates.length} certificates</p>
                <div className="mt-4 p-4 bg-teal-900/20 border border-teal-700/30 rounded-lg">
                  <p className="text-sm text-teal-300 mb-2">
                    ✓ Users can retrieve their certificates at:
                  </p>
                  <code className="text-xs text-teal-400 bg-teal-950/50 px-3 py-2 rounded block">
                    {window.location.origin}/get-certificate
                  </code>
                  <p className="text-xs text-gray-400 mt-2">
                    Share this link with participants to download their certificates
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <Button
                  onClick={downloadAllCertificates}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Certificates
                </Button>
                <Button
                  onClick={() => {
                    setStep(1);
                    setTemplateFile(null);
                    setTemplatePreview(null);
                    setCsvFile(null);
                    setGeneratedCertificates([]);
                    setOrganizationName('');
                  }}
                  variant="outline"
                  className="border-gray-700 text-gray-300"
                >
                  Generate More
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generatedCertificates.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-teal-400" />
                      <div>
                        <div className="text-white font-medium">{cert.user_name}</div>
                        <div className="text-gray-400 text-sm">{cert.user_email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">{cert.role}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = cert.certificate_url;
                          link.download = `Certificate_${cert.user_name.replace(/\s+/g, '_')}.png`;
                          link.click();
                        }}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
