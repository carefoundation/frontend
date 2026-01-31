'use client';

import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any>;
}

export default function ViewModal({ isOpen, onClose, title, data }: ViewModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-x-hidden">
            <div className="space-y-4">
              {Object.entries(data).map(([key, value]) => {
                // Handle arrays of images/documents
                if (Array.isArray(value) && value.length > 0) {
                  const firstItem = value[0];
                  const isImageArray = typeof firstItem === 'string' && (
                    firstItem.startsWith('data:image/') || 
                    firstItem.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(firstItem)
                  );
                  const isPdfArray = typeof firstItem === 'string' && (
                    firstItem.startsWith('data:application/pdf') || 
                    firstItem.startsWith('http') && firstItem.toLowerCase().endsWith('.pdf')
                  );
                  
                  if (isImageArray) {
                    return (
                      <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="space-y-3">
                          {value.map((img: string, idx: number) => (
                            <div key={idx} className="mt-2">
                              <img 
                                src={img} 
                                alt={`${key} ${idx + 1}`}
                                className="w-full max-w-full h-auto rounded-lg border border-gray-200 max-h-96 object-contain"
                              />
                              <a 
                                href={img} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                              >
                                Open image {idx + 1} in new tab
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else if (isPdfArray) {
                    return (
                      <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="space-y-3">
                          {value.map((doc: string, idx: number) => (
                            <div key={idx} className="mt-2">
                              {doc.startsWith('http') || doc.startsWith('data:') ? (
                                <>
                                  <iframe
                                    src={doc}
                                    className="w-full max-w-full h-96 border border-gray-200 rounded-lg"
                                    title={`${key} ${idx + 1}`}
                                  />
                                  <a 
                                    href={doc} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                                  >
                                    Open PDF {idx + 1} in new tab
                                  </a>
                                </>
                              ) : (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-2">Document {idx + 1}:</p>
                                  <p className="font-medium text-gray-900">{doc}</p>
                                  <p className="text-xs text-gray-500 mt-1">File name (uploaded during registration)</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    // Handle array of documents (can be file names or base64 data)
                    return (
                      <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="space-y-3">
                          {value.map((item: string, idx: number) => {
                            // Check if it's base64 data with file name (format: "filename::base64data")
                            const parts = item.split('::');
                            const fileName = parts.length > 1 ? parts[0] : null;
                            const fileData = parts.length > 1 ? parts[1] : item;
                            
                            const isBase64Image = fileData.startsWith('data:image/');
                            const isBase64Pdf = fileData.startsWith('data:application/pdf');
                            
                            return (
                              <div key={idx} className="mt-2">
                                {isBase64Image ? (
                                  <div>
                                    {fileName && (
                                      <p className="text-sm font-medium text-gray-900 mb-2">{fileName}</p>
                                    )}
                                    <img 
                                      src={fileData} 
                                      alt={fileName || `Document ${idx + 1}`}
                                      className="w-full max-w-full h-auto rounded-lg border border-gray-200 max-h-96 object-contain"
                                    />
                                    <a 
                                      href={fileData} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                                    >
                                      Open image in new tab
                                    </a>
                                  </div>
                                ) : isBase64Pdf ? (
                                  <div>
                                    {fileName && (
                                      <p className="text-sm font-medium text-gray-900 mb-2">{fileName}</p>
                                    )}
                          <iframe
                            src={fileData}
                            className="w-full max-w-full h-96 border border-gray-200 rounded-lg"
                            title={fileName || `Document ${idx + 1}`}
                          />
                                    <a 
                                      href={fileData} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                                    >
                                      Open PDF in new tab
                                    </a>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-900">{item}</p>
                                    <p className="text-xs text-gray-500 mt-1">Document {idx + 1} (file name)</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                }
                
                // Check if value contains base64 data with filename (format: "filename::base64data")
                let displayValue = value;
                let fileName = null;
                if (typeof value === 'string' && value.includes('::')) {
                  const parts = value.split('::');
                  fileName = parts[0];
                  displayValue = parts[1];
                }
                
                const isImage = typeof displayValue === 'string' && (
                  displayValue.startsWith('data:image/') || 
                  displayValue.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(displayValue)
                );
                const isPdf = typeof displayValue === 'string' && (
                  displayValue.startsWith('data:application/pdf') || 
                  displayValue.startsWith('http') && displayValue.toLowerCase().endsWith('.pdf')
                );
                const isBase64Image = typeof displayValue === 'string' && displayValue.startsWith('data:image/');
                const isBase64Pdf = typeof displayValue === 'string' && displayValue.startsWith('data:application/pdf');

                return (
                  <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-base text-gray-900">
                      {isImage ? (
                        <div className="mt-2">
                          {fileName && (
                            <p className="text-sm font-medium text-gray-900 mb-2">{fileName}</p>
                          )}
                          <img 
                            src={displayValue} 
                            alt={fileName || key}
                            className="w-full max-w-full h-auto rounded-lg border border-gray-200 max-h-96 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'block';
                              }
                            }}
                          />
                          <div style={{ display: 'none' }} className="text-red-500 text-sm mt-2">
                            Failed to load image
                          </div>
                          <a 
                            href={displayValue} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                          >
                            Open image in new tab
                          </a>
                        </div>
                      ) : isPdf ? (
                        <div className="mt-2">
                          {fileName && (
                            <p className="text-sm font-medium text-gray-900 mb-2">{fileName}</p>
                          )}
                          <iframe
                            src={displayValue}
                            className="w-full max-w-full h-96 border border-gray-200 rounded-lg"
                            title={fileName || key}
                          />
                          <a 
                            href={displayValue} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                          >
                            Open PDF in new tab
                          </a>
                        </div>
                      ) : typeof value === 'object' && value !== null ? (
                        (value.morning || value.evening || value.night) ? (
                          <div className="grid grid-cols-1 gap-3 mt-2">
                            {['morning', 'evening', 'night'].map((slot) => {
                              const slotData = value[slot];
                              if (!slotData) return null;
                              const hasTime = slotData.from && slotData.to;
                              const hasDays = Array.isArray(slotData.days) && slotData.days.length > 0;
                              
                              if (!hasTime && !hasDays) return null;

                              return (
                                <div key={slot} className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-700 capitalize">{slot} Shift</span>
                                    {hasTime ? (
                                      <span className="text-sm font-medium bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/20">
                                        {slotData.from} - {slotData.to}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">No time set</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 flex items-start gap-1">
                                    <span className="font-medium text-gray-500 uppercase tracking-wide text-[10px] mt-0.5">Days:</span>
                                    <span>{hasDays ? slotData.days.join(', ') : 'All Days'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-hidden whitespace-pre-wrap font-mono text-gray-700 border border-gray-200 break-words">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        )
                      ) : (
                        String(value || 'N/A')
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

