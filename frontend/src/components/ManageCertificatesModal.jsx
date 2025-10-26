import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Download, FileText, Award, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { certificateAPI } from '@/lib/api';

export default function ManageCertificatesModal({ hackathon, onClose }) {
  const [step, setStep] = useState(1); // 1: Upload Template, 2: Position Editor, 3: Generate Certificates
  const [template, setTemplate] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [positions, setPositions] = useState({
    name: { x: 500, y: 400, color: '#000000', fontSize: 48 },
    role: { x: 500, y: 500, color: '#333333', fontSize: 32 },
    hackathon: { x: 500, y: 300, color: '#000000', fontSize: 32 },
    date: { x: 500, y: 600, color: '#666666', fontSize: 24 },
    qr: { x: 50, y: 50, size: 100 }
  });
  const [draggedField, setDraggedField] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    fetchTemplate();
    fetchCertificates();
  }, []);

  const fetchTemplate = async () => {
    try {
      const response = await certificateAPI.getTemplate(hackathon.id);
      if (response.data) {
        setTemplate(response.data);
        setTemplatePreview(process.env.REACT_APP_BACKEND_URL + response.data.template_url);
        if (response.data.text_positions && Object.keys(response.data.text_positions).length > 0) {
          setPositions(response.data.text_positions);
          setStep(2);
        }
      }
    } catch (error) {
      console.log('No template found');
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await certificateAPI.getHackathonCertificates(hackathon.id);
      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.log('No certificates found');
    }
  };

  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast.error('Only PNG and JPG images are allowed');
      return;
    }

    setTemplateFile(file);
    const previewUrl = URL.createObjectURL(file);
    setTemplatePreview(previewUrl);
    
    setLoading(true);
    try {
      const response = await certificateAPI.uploadTemplate(hackathon.id, file);
      toast.success('Template uploaded successfully!');
      setTemplate(response.data);
      setStep(2);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload template');
    } finally {
      setLoading(false);
    }
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

  const handleSavePositions = async () => {
    setLoading(true);
    try {
      await certificateAPI.updatePositions(hackathon.id, positions);
      toast.success('Positions saved successfully!');
      setStep(3);
    } catch (error) {
      toast.error('Failed to save positions');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are allowed');
      return;
    }

    setCsvFile(file);
    
    setLoading(true);
    try {
      const response = await certificateAPI.bulkGenerate(hackathon.id, file);
      toast.success(
        <div>
          <div className="font-semibold">Certificates Generated!</div>
          <div className="text-sm mt-1">
            {response.data.certificates_generated} certificates created successfully
          </div>
          {response.data.errors && response.data.errors.length > 0 && (
            <div className="text-sm text-yellow-400 mt-1">
              {response.data.errors.length} errors occurred
            </div>
          )}
        </div>,
        { duration: 5000 }
      );
      await fetchCertificates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csv = `Name,Email,Role\nJohn Doe,john@example.com,participation\nJane Smith,jane@example.com,judge\nBob Wilson,bob@example.com,organizer`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.create('a');
    a.href = url;
    a.download = 'certificate_sample.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Certificate Management</h2>
            <p className="text-gray-400 text-sm mt-1">{hackathon.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 p-4 border-b border-gray-800">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-400'}`}>
                {s === 1 ? 'Upload' : s === 2 ? 'Position' : 'Generate'}
              </span>
              {s < 3 && <div className="w-12 h-0.5 bg-gray-700"></div>}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload Template */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto">
              <Card className="glass-effect p-8 border border-gray-800">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Upload Certificate Template</h3>
                  <p className="text-gray-400 mb-6">Upload a PNG or JPG image to use as your certificate template</p>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleTemplateUpload}
                      className="hidden"
                    />
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Template Image
                    </Button>
                  </label>

                  {templatePreview && (
                    <div className="mt-6">
                      <img src={templatePreview} alt="Template Preview" className="max-w-full h-auto rounded-lg border border-gray-700" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Position Editor */}
          {step === 2 && templatePreview && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="glass-effect p-4 border border-gray-800">
                  <h3 className="text-lg font-bold text-white mb-2">Click to Position Fields</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {draggedField ? 
                      `Click on the template where you want to place "${draggedField}"` : 
                      'Select a field from the right panel, then click on the template'
                    }
                  </p>
                  <div className="relative border-2 border-dashed border-gray-700 rounded-lg overflow-hidden bg-gray-900/30"
                       style={{ cursor: draggedField ? 'crosshair' : 'default' }}>
                    <img 
                      src={templatePreview} 
                      alt="Template"
                      className="w-full h-auto"
                      onClick={handleImageClick}
                      style={{ display: 'block' }}
                    />
                    {/* Position Indicators */}
                    {Object.keys(positions).map((field) => (
                      <div
                        key={field}
                        style={{
                          position: 'absolute',
                          left: `${positions[field].x}px`,
                          top: `${positions[field].y}px`,
                          transform: 'translate(-50%, -50%)',
                          padding: '4px 8px',
                          background: 'rgba(20, 184, 166, 0.9)',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          pointerEvents: 'none',
                          border: '2px solid #14b8a6',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {field.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div>
                <Card className="glass-effect p-4 border border-gray-800 sticky top-4">
                  <h3 className="text-lg font-bold text-white mb-4">Select Field to Position</h3>
                  <div className="space-y-2 mb-6">
                    {Object.keys(positions).map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          setDraggedField(field);
                          toast.info(`Click on template to place "${field}"`);
                        }}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          draggedField === field
                            ? 'bg-teal-900/50 border-teal-500 shadow-lg'
                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white capitalize font-medium">{field}</span>
                          <Award className={`w-4 h-4 ${draggedField === field ? 'text-teal-400' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Position: ({positions[field].x}, {positions[field].y})
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleSavePositions}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {loading ? 'Saving...' : 'Save Positions & Continue'}
                  </Button>
                  
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="w-full mt-2 border-gray-700 text-gray-300"
                  >
                    Change Template
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Generate Certificates */}
          {step === 3 && (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="glass-effect p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">Generate Certificates from CSV</h3>
                
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-2">CSV Format Required:</p>
                      <code className="text-xs text-blue-200 bg-blue-950/50 px-2 py-1 rounded">
                        Name, Email, Role
                      </code>
                      <p className="text-blue-300 text-xs mt-2">
                        Roles: participation, judge, organizer, or any custom role
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload CSV & Generate
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
              </Card>

              {/* Certificates List */}
              {certificates.length > 0 && (
                <Card className="glass-effect p-6 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Generated Certificates ({certificates.length})
                  </h3>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-teal-400" />
                          <div>
                            <div className="text-white font-medium">{cert.user_name}</div>
                            <div className="text-gray-400 text-sm">{cert.user_email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 capitalize">{cert.role}</span>
                          <span className="text-xs text-teal-400 font-mono">{cert.certificate_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
            Close
          </Button>
          {step > 1 && step < 3 && (
            <Button onClick={() => setStep(step - 1)} variant="outline" className="border-gray-700 text-gray-300">
              Previous
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
