import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, Tag as TagIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePosts } from '../../contexts/PostsContext';
import toast from 'react-hot-toast';

// Common medical specialties for tag suggestions
const TAG_SUGGESTIONS = [
  'cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery',
  'radiology', 'dermatology', 'endocrinology', 'gastroenterology',
  'pulmonology', 'infectious disease', 'emergency', 'nephrology'
];

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Surgery',
  'Radiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Pulmonology', 'Infectious Disease', 'Emergency', 'Nephrology'
];

const GENDERS = ['Male', 'Female', 'Other'];

const STEPS = [
  'Case Overview',
  'Patient Details',
  'Medical Images',
  'Diagnosis & Treatment',
  'Review & Publish',
];

// Add this interface above initialState
interface CreatePostFormState {
  title: string;
  specialty: string;
  tags: string[];
  tagInput: string;
  content: string;
  age: string;
  gender: string;
  symptoms: string;
  history: string;
  images: string[];
  imageDescriptions: string[];
  diagnosis: string;
  treatment: string;
  outcome: string;
}

const initialState: CreatePostFormState = {
  title: '',
  specialty: '',
  tags: [],
  tagInput: '',
  content: '',
  age: '',
  gender: '',
  symptoms: '',
  history: '',
  images: [],
  imageDescriptions: [],
  diagnosis: '',
  treatment: '',
  outcome: '',
};

const CreatePostForm: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreatePostFormState>(initialState);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { createPost } = usePosts();

  // Tag logic
  const filteredSuggestions = TAG_SUGGESTIONS.filter(tag => 
    tag.toLowerCase().includes(form.tagInput.toLowerCase()) && 
    !form.tags.includes(tag)
  ).slice(0, 5);

  const handleAddTag = (tag: string) => {
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm({ ...form, tags: [...form.tags, tag], tagInput: '' });
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  // Image logic
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (form.images.length < 3 && e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setForm({ ...form, images: [...form.images, url], imageDescriptions: [...form.imageDescriptions, ''] });
    } else if (form.images.length >= 3) {
      toast.error('Maximum 3 images allowed');
    }
  };
  const handleRemoveImage = (index: number) => {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index),
      imageDescriptions: form.imageDescriptions.filter((_, i) => i !== index),
    });
  };
  const handleImageDescription = (index: number, desc: string) => {
    const newDescs = [...form.imageDescriptions];
    newDescs[index] = desc;
    setForm({ ...form, imageDescriptions: newDescs });
  };

  // Step validation
  const validateStep = () => {
    switch (step) {
      case 0:
        return form.title.trim() && form.specialty && form.content.trim();
      case 1:
        return form.age && form.gender && form.symptoms.trim();
      case 3:
        return form.diagnosis.trim() && form.treatment.trim();
      default:
        return true;
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newPost = await createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        images: form.images,
        tags: form.tags,
        specialty: form.specialty,
        age: form.age,
        gender: form.gender,
        symptoms: form.symptoms,
        history: form.history,
        imageDescriptions: form.imageDescriptions,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        outcome: form.outcome,
      });
      toast.success('Post created successfully!');
      navigate(`/post/${newPost.id}`);
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center mb-8">
      {STEPS.map((label, idx) => (
        <React.Fragment key={label}>
          <div className={`flex items-center ${idx <= step ? 'text-primary font-bold' : 'text-gray-400'}`}> 
            <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${idx <= step ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white'}`}>{idx + 1}</div>
            <span className="ml-2 text-sm">{label}</span>
          </div>
          {idx < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
        </React.Fragment>
      ))}
    </div>
  );

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief, descriptive title for your case" className="w-full px-4 py-2 border border-gray-300 rounded-lg" maxLength={100} required />
            </div>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Specialty *</label>
                <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select specialty...</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="bg-blue-50 text-primary px-2 py-1 rounded-full text-sm flex items-center">#{tag}<button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 text-gray-500 hover:text-red-500"><X size={14} /></button></span>
                  ))}
                </div>
                <div className="relative">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50"><TagIcon size={18} className="text-gray-500" /></div>
                    <input type="text" value={form.tagInput} onChange={e => setForm({ ...form, tagInput: e.target.value })} onFocus={() => setShowTagSuggestions(true)} onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(form.tagInput); }}} placeholder={form.tags.length >= 5 ? "Maximum 5 tags" : "Add a tag (e.g., cardiology)"} className="flex-1 px-3 py-2 focus:outline-none" disabled={form.tags.length >= 5} />
                  </div>
                  {showTagSuggestions && form.tagInput && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                      {filteredSuggestions.map(suggestion => (
                        <button key={suggestion} type="button" onClick={() => handleAddTag(suggestion)} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-primary">{suggestion}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Description *</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Provide a detailed overview of the medical case..." className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px]" required />
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <input type="number" min="0" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select gender...</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms *</label>
              <input type="text" value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} placeholder="E.g., fever, cough, shortness of breath" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Relevant History</label>
              <textarea value={form.history} onChange={e => setForm({ ...form, history: e.target.value })} placeholder="Medical, surgical, family, social history (optional)" className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[80px]" />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images (Optional)</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {form.images.map((image, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <img src={image} alt="Case" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"><X size={16} className="text-red-500" /></button>
                    <input type="text" value={form.imageDescriptions[index] || ''} onChange={e => handleImageDescription(index, e.target.value)} placeholder="Image description (optional)" className="mt-1 w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                  </div>
                ))}
                {form.images.length < 3 && (
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                    <input type="file" accept="image/*" className="sr-only" onChange={handleAddImage} />
                    <ImagePlus size={24} className="text-gray-400" />
                  </label>
                )}
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
              <input type="text" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Final or working diagnosis" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Provided *</label>
              <textarea value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="Medications, procedures, interventions" className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[80px]" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <textarea value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} placeholder="Patient's progress, complications, follow-up (optional)" className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[60px]" />
            </div>
          </>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Review & Publish</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div><b>Title:</b> {form.title}</div>
              <div><b>Specialty:</b> {form.specialty}</div>
              <div><b>Tags:</b> {form.tags.join(', ')}</div>
              <div><b>Description:</b> {form.content}</div>
              <div><b>Age:</b> {form.age}</div>
              <div><b>Gender:</b> {form.gender}</div>
              <div><b>Symptoms:</b> {form.symptoms}</div>
              <div><b>History:</b> {form.history}</div>
              <div><b>Diagnosis:</b> {form.diagnosis}</div>
              <div><b>Treatment:</b> {form.treatment}</div>
              <div><b>Outcome:</b> {form.outcome}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="w-20 h-20 rounded overflow-hidden border"><img src={img} alt="Case" className="w-full h-full object-cover" /></div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 w-full max-w-3xl md:max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Share New Medical Case</h1>
      <Stepper />
      <div className="mb-6">{renderStep()}</div>
      <div className="flex justify-between items-center mt-8">
        <button type="button" onClick={() => step === 0 ? navigate('/') : setStep(step - 1)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"><ChevronLeft className="mr-1" size={18} />{step === 0 ? 'Cancel' : 'Back'}</button>
        {step < STEPS.length - 1 ? (
          <button type="button" disabled={!validateStep()} onClick={() => setStep(step + 1)} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary-dark flex items-center">Next<ChevronRight className="ml-1" size={18} /></button>
        ) : (
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary-dark">{isSubmitting ? 'Publishing...' : 'Publish Case'}</button>
        )}
      </div>
    </form>
  );
};

export default CreatePostForm;