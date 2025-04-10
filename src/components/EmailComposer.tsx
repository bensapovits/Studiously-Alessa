import React, { useState, useRef } from 'react';
import { X, Paperclip, Clock, Send, Loader2, AlertCircle } from 'lucide-react';
import { sendEmail } from '../lib/gmail';

interface EmailComposerProps {
  recipients: Array<{ id: string; name: string; email: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailComposer({ recipients, onClose, onSuccess }: EmailComposerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 25 * 1024 * 1024); // 25MB limit
    
    if (validFiles.length !== files.length) {
      setError('Some files exceeded the 25MB size limit');
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert attachments to base64
      const attachmentPromises = attachments.map(async file => {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return {
          filename: file.name,
          content: base64,
          mimeType: file.type
        };
      });

      const emailAttachments = await Promise.all(attachmentPromises);

      await sendEmail({
        to: recipients.map(r => r.email),
        subject,
        body,
        attachments: emailAttachments,
        scheduledTime: scheduledTime || undefined
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-gray-50">
              {recipients.map(recipient => (
                <span
                  key={recipient.id}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                >
                  {recipient.name} ({recipient.email})
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Attachments */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAttachmentChange}
              multiple
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Add Attachments
              </button>
              <span className="text-xs text-gray-500">Max size: 25MB per file</span>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Send (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {scheduledTime ? 'Schedule' : 'Send'} Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}