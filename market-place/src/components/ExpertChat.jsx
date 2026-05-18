import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ExpertChat = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReview, setExistingReview] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const isExpert = user?.role === 'expert' || user?.role === 'admin';

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${consultationId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchConsultations = async () => {
    try {
      const endpoint = isExpert 
        ? `${import.meta.env.VITE_API_URL}/api/expert-consultations/expert/${user.id}`
        : `${import.meta.env.VITE_API_URL}/api/expert-consultations/user/${user.id}`;
        
      const res = await fetch(endpoint);
      const data = await res.json();
      setConsultations(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      const data = await res.json();
      setMarketplaceProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    if (showProductModal && marketplaceProducts.length === 0) {
      fetchProducts();
    }
  }, [showProductModal]);

  const filteredProducts = marketplaceProducts.filter(p => {
    const q = productSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || 
           p.category?.toLowerCase().includes(q) ||
           p.description?.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConsultations();
  }, [user, consultationId, navigate]);

  const fetchReview = async () => {
    if (!consultationId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${consultationId}/review`);
      if (res.ok) {
        const data = await res.json();
        setExistingReview(data);
      }
    } catch (err) {
      console.error('Error fetching review:', err);
    }
  };

  useEffect(() => {
    if (consultationId) {
      fetchMessages();
      fetchReview();
      // Simple polling for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages();
        fetchConsultations(); // polling to update status if closed
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [consultationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(i18n.language === 'ar' ? 'يرجى اختيار صورة صالحة.' : 'Veuillez sélectionner une image valide.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert(i18n.language === 'ar' ? 'حجم الصورة كبير جداً.' : 'La taille de l\'image est trop grande.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      // clear audio if any
      setAudioBlob(null);
      setAudioPreviewUrl('');
    };
    reader.readAsDataURL(file);
  };

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // clear other inputs
      setNewMessage('');
      setSelectedImage(null);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert(i18n.language === 'ar' ? 'الميكروفون غير مصرح به. يرجى السماح بالوصول إلى الميكروفون.' : 'Microphone non autorisé. Veuillez autoriser l\'accès au micro.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setAudioPreviewUrl('');
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRecommendProduct = async (product) => {
    setShowProductModal(false);
    
    const msgText = i18n.language === 'ar' ? 'أنصحك بهذا المنتج.' : 'Je vous recommande ce produit.';
    
    const optimisticMsg = {
      id: Date.now(),
      sender_id: user.id,
      sender_role: 'expert',
      message: msgText,
      message_type: 'product_recommendation',
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${consultationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderRole: 'expert',
          message: msgText,
          message_type: 'product_recommendation',
          product_id: product.id
        })
      });
      fetchMessages();
    } catch (err) {
      console.error('Error sending product recommendation:', err);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: currentConsultation.id,
          expertId: currentConsultation.expert_id,
          clientId: user.id,
          reason: reportReason,
          description: reportDescription
        })
      });
      if (res.ok) {
        setReportSuccess(true);
        setReportReason('');
        setReportDescription('');
      } else {
        const errorData = await res.json();
        alert(i18n.language === 'ar' ? 'حدث خطأ أثناء الإرسال: ' + errorData.error : 'Une erreur s\'est produite : ' + errorData.error);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert(i18n.language === 'ar' ? 'حدث خطأ في الاتصال.' : 'Erreur de connexion.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: currentConsultation.id,
          expertId: currentConsultation.expert_id,
          clientId: user.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        setReviewSuccess(true);
        fetchReview();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Error submitting review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  const handleCloseConsultation = async () => {
    if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد أنك تريد إنهاء الاستشارة؟' : 'Êtes-vous sûr de vouloir terminer cette consultation ?')) return;
    try {
      const role = isExpert ? 'expert' : 'client';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${consultationId}/request-close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Optimistic system message
        const msgText = i18n.language === 'ar' 
            ? (data.status === 'closed' ? 'تم إنهاء الاستشارة.' : (isExpert ? 'يرغب الخبير في إنهاء هذه الاستشارة.' : 'يرغب العميل في إنهاء هذه الاستشارة.'))
            : (data.status === 'closed' ? 'La consultation est terminée.' : (isExpert ? 'L’expert souhaite terminer cette consultation.' : 'Le client souhaite terminer cette consultation.'));
            
        await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${consultationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            senderRole: role,
            message: msgText,
            message_type: 'system'
          })
        });
        
        fetchConsultations();
        fetchMessages();
      }
    } catch (err) {
      console.error('Error requesting close:', err);
    }
  };

  const handleStartNewConsultation = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          expertId: currentConsultation.expert_id,
          categoryId: currentConsultation.category_id
        })
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/expert-chat/${data.consultationId}`);
        fetchConsultations();
      }
    } catch (err) {
      console.error('Error starting new consultation:', err);
    }
  };

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !selectedImage && !audioBlob) return;

    let payload = {
      senderId: user.id,
      senderRole: isExpert ? 'expert' : 'user',
      message: '',
      image: null,
      message_type: 'text'
    };

    if (audioBlob) {
      payload.message_type = 'audio';
      payload.message = await convertBlobToBase64(audioBlob);
    } else {
      const msgText = newMessage.trim();
      // Contact Blocking logic
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const phoneRegex = /(\+?\d[\d\-\s]{7,}\d)/;
      if (emailRegex.test(msgText) || phoneRegex.test(msgText)) {
        alert(i18n.language === 'ar' 
          ? "إرسال أرقام الهاتف أو عناوين البريد الإلكتروني ممنوع داخل هذه الدردشة الآمنة." 
          : "L’envoi de numéros de téléphone ou d’adresses email est interdit dans ce chat sécurisé.");
        return;
      }
      payload.message = msgText;
      payload.image = selectedImage;
    }

    // Clear local states immediately
    setNewMessage('');
    setSelectedImage(null);
    setAudioBlob(null);
    setAudioPreviewUrl('');

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now(),
      sender_id: user.id,
      sender_role: isExpert ? 'expert' : 'user',
      message: payload.message_type === 'audio' ? payload.message : payload.message,
      image: payload.image,
      message_type: payload.message_type,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${consultationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchMessages(); // re-sync
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-[#fafaf7]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1f5f2e] border-t-transparent"></div>
      </div>
    );
  }

  const currentConsultation = consultations.find(c => c.id === parseInt(consultationId));

  return (
    <main className="pt-20 h-screen flex flex-col bg-[#fafaf7] overflow-hidden">
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full border-x border-[#e5e7eb] shadow-sm bg-white">
        
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-[#e5e7eb] flex flex-col bg-[#fafaf7] hidden md:flex">
          <div className="p-5 border-b border-[#e5e7eb] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#1f5f2e] text-2xl">forum</span>
            <span className="font-bold text-lg text-gray-800">
              {i18n.language === 'ar' ? 'استشاراتي' : 'Mes consultations'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {consultations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                {i18n.language === 'ar' ? 'لا توجد استشارات حالية.' : 'Aucune consultation pour le moment.'}
              </div>
            ) : (
              consultations.map(c => {
                const isActive = c.id === parseInt(consultationId);
                return (
                  <Link 
                    key={c.id} 
                    to={`/expert-chat/${c.id}`}
                    className={`flex items-start gap-4 p-4 border-b border-[#e5e7eb] hover:bg-gray-50 transition-colors ${isActive ? 'bg-[#eef6ee] border-l-4 border-l-[#1f5f2e]' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border border-[#e5e7eb] shadow-sm flex-shrink-0">
                      {c.expert_image && !isExpert ? (
                        <img src={c.expert_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">person</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className={`font-bold text-sm truncate ${isActive ? 'text-[#1f5f2e]' : 'text-gray-800'}`}>
                          {isExpert ? c.client_name : (i18n.language === 'ar' ? c.expert_name_ar : c.expert_name_fr)}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {new Date(c.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-[#1f5f2e] opacity-80 mb-1 truncate">
                        {i18n.language === 'ar' ? c.category_name_ar : c.category_name_fr}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {c.last_message || (i18n.language === 'ar' ? 'بداية الاستشارة' : 'Début de consultation')}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative bg-[#fafaf7]">
          {currentConsultation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center bg-white shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <Link to="/my-expert-consultations" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </Link>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm relative">
                    {!isExpert && currentConsultation.expert_image ? (
                      <img src={currentConsultation.expert_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 text-xl">person</span>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">
                      {isExpert ? currentConsultation.client_name : (i18n.language === 'ar' ? currentConsultation.expert_name_ar : currentConsultation.expert_name_fr)}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[#1f5f2e] font-medium">{i18n.language === 'ar' ? currentConsultation.category_name_ar : currentConsultation.category_name_fr}</p>
                      <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-bold">
                        {i18n.language === 'ar' ? 'متصل' : 'En ligne'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentConsultation.status !== 'closed' && (
                    <button 
                      onClick={handleCloseConsultation}
                      disabled={isExpert ? currentConsultation.expert_close_requested : currentConsultation.client_close_requested}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {(isExpert ? currentConsultation.expert_close_requested : currentConsultation.client_close_requested)
                        ? (i18n.language === 'ar' ? 'تم طلب الإنهاء' : 'Fermeture demandée')
                        : (i18n.language === 'ar' ? 'إنهاء الاستشارة' : 'Terminer')}
                    </button>
                  )}
                  {!isExpert && currentConsultation.status === 'closed' && !existingReview && (
                    <button 
                      onClick={() => setShowReviewModal(true)}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] filled">star</span>
                      <span>{i18n.language === 'ar' ? 'تقييم' : 'Évaluer'}</span>
                    </button>
                  )}
                  {!isExpert && currentConsultation.status === 'closed' && existingReview && (
                    <div className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px] text-yellow-500 filled">star</span>
                      <span>{existingReview.rating}/5</span>
                    </div>
                  )}
                  {!isExpert && (
                    <button 
                      onClick={() => setShowReportModal(true)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title={i18n.language === 'ar' ? 'الإبلاغ عن مشكلة' : 'Signaler un problème'}
                    >
                      <span className="material-symbols-outlined text-[20px]">report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <div className="flex justify-center mb-6">
                  <div className="text-center text-xs text-[#1f5f2e] bg-[#eef6ee] border border-[#1f5f2e]/20 px-4 py-2 rounded-full max-w-sm flex items-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    {i18n.language === 'ar' 
                      ? 'تتم هذه المحادثة داخل المنصة فقط لضمان الخصوصية.' 
                      : 'Cette conversation se déroule uniquement dans la plateforme afin de garantir la confidentialité.'}
                  </div>
                </div>
                
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user.id;
                  const isSystem = msg.message_type === 'system';
                  
                  if (isSystem) {
                    return (
                      <div key={idx} className="flex justify-center my-4">
                        <span className="bg-gray-100 text-gray-500 text-xs px-4 py-1.5 rounded-full border border-gray-200">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] md:max-w-[65%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl px-5 py-3 shadow-sm ${
                          isMine 
                            ? 'bg-[#1f5f2e] text-white rounded-br-sm' 
                            : 'bg-white text-gray-800 border border-[#e5e7eb] rounded-bl-sm'
                        }`}>
                          
                          {/* Audio Message */}
                          {msg.message_type === 'audio' && (
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-2xl ${isMine ? 'text-[#eef6ee]' : 'text-[#1f5f2e]'}`}>mic</span>
                              <audio controls src={msg.message} className="h-10 w-48 custom-audio-player"></audio>
                            </div>
                          )}

                          {/* Product Recommendation */}
                          {msg.message_type === 'product_recommendation' && msg.product_id && (
                            <div className="mt-2 mb-3 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm min-w-[220px] max-w-[280px]">
                              {msg.product_image && (
                                <div className="h-36 w-full bg-gray-100 relative">
                                  <div className="absolute top-2 left-2 bg-[#1f5f2e] text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
                                    {i18n.language === 'ar' ? 'منتج مقترح' : 'Produit recommandé'}
                                  </div>
                                  <img src={msg.product_image} alt={msg.product_name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="p-3 text-left bg-white">
                                <h4 className={`font-bold text-sm text-gray-900 line-clamp-2 leading-tight mb-1 ${i18n.language === 'ar' ? 'text-right' : ''}`}>{msg.product_name}</h4>
                                <p className={`text-[#1f5f2e] font-black text-sm mb-3 ${i18n.language === 'ar' ? 'text-right' : ''}`}>{msg.product_price} MAD</p>
                                <Link 
                                  to={`/product/${msg.product_id}`}
                                  className="block w-full text-center bg-[#1f5f2e] hover:bg-[#1a4a24] text-white py-2 rounded-lg text-xs font-bold transition-colors"
                                >
                                  {i18n.language === 'ar' ? 'عرض المنتج' : 'Voir le produit'}
                                </Link>
                              </div>
                            </div>
                          )}

                          {/* Image Message */}
                          {msg.image && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                              <img src={msg.image} alt="Attachment" className="max-w-full h-auto max-h-60 object-contain" />
                            </div>
                          )}

                          {/* Text Message */}
                          {msg.message && msg.message_type !== 'audio' && (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                              {msg.message_type === 'product_recommendation' && (msg.message === 'Je vous recommande ce produit.' || msg.message === 'أنصحك بهذا المنتج.')
                                ? (i18n.language === 'ar' ? 'أنصحك بهذا المنتج.' : 'Je vous recommande ce produit.')
                                : msg.message}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Attachments Preview Area */}
              {(selectedImage || audioPreviewUrl) && (
                <div className="p-4 bg-white border-t border-[#e5e7eb] relative z-20 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
                  {selectedImage && (
                    <div className="relative inline-block">
                      <img src={selectedImage} alt="Preview" className="h-24 w-auto rounded-xl shadow-md border border-gray-200" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  )}
                  {audioPreviewUrl && (
                    <div className="relative inline-flex items-center gap-4 bg-[#eef6ee] p-3 rounded-2xl border border-[#1f5f2e]/20 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#1f5f2e]">graphic_eq</span>
                        <audio src={audioPreviewUrl} controls className="h-10 outline-none"></audio>
                      </div>
                      <button 
                        onClick={cancelAudio}
                        className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              {currentConsultation.status !== 'closed' ? (
                <div className="p-4 bg-white border-t border-[#e5e7eb] flex items-end gap-3 z-20">
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleImageChange} 
                  />
                  
                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between bg-red-50 border border-red-200 rounded-full px-6 py-3 shadow-sm">
                      <div className="flex items-center gap-3 text-red-500">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-bold tracking-wider">{formatTime(recordingTime)}</span>
                        <span className="text-sm hidden sm:inline font-medium">{i18n.language === 'ar' ? 'جاري التسجيل...' : 'Enregistrement...'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={cancelAudio} className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors hover:bg-red-100">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                        <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">stop</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current.click()}
                        className="w-12 h-12 text-gray-400 hover:text-[#1f5f2e] bg-gray-50 hover:bg-[#eef6ee] rounded-full flex items-center justify-center transition-colors border border-transparent hover:border-[#1f5f2e]/20 flex-shrink-0"
                      >
                        <span className="material-symbols-outlined">image</span>
                      </button>
                      
                      {isExpert && (
                        <button 
                          type="button" 
                          onClick={() => setShowProductModal(true)}
                          className="w-12 h-12 text-gray-400 hover:text-[#1f5f2e] bg-gray-50 hover:bg-[#eef6ee] rounded-full flex items-center justify-center transition-colors border border-transparent hover:border-[#1f5f2e]/20 flex-shrink-0"
                          title={i18n.language === 'ar' ? 'اقتراح منتج' : 'Recommander un produit'}
                        >
                          <span className="material-symbols-outlined">inventory_2</span>
                        </button>
                      )}
                      
                      <button 
                        type="button" 
                        onClick={startRecording}
                        className="w-12 h-12 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors border border-transparent hover:border-red-200 flex-shrink-0"
                        title={i18n.language === 'ar' ? 'تسجيل صوتي' : 'Message vocal'}
                      >
                        <span className="material-symbols-outlined">mic</span>
                      </button>

                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl flex items-end overflow-hidden focus-within:ring-2 focus-within:ring-[#1f5f2e]/30 focus-within:border-[#1f5f2e] transition-all">
                        <textarea 
                          className="flex-1 bg-transparent px-5 py-3.5 text-[15px] outline-none resize-none max-h-32 min-h-[52px]"
                          placeholder={i18n.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Écrivez votre message ici...'}
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = (e.target.scrollHeight) + 'px';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows={1}
                        />
                      </div>
                      
                      <button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() && !selectedImage && !audioBlob}
                        className="w-14 h-14 bg-[#1f5f2e] text-white rounded-full flex items-center justify-center hover:bg-[#1a4a24] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0 active:scale-95"
                      >
                        <span className="material-symbols-outlined ml-1">send</span>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-white border-t border-[#e5e7eb] flex flex-col items-center gap-3">
                  <div className="text-gray-500 font-medium">
                    {i18n.language === 'ar' ? 'هذه الاستشارة مغلقة.' : 'Cette consultation est fermée.'}
                  </div>
                  {!isExpert && (
                    <button 
                      onClick={handleStartNewConsultation}
                      className="px-6 py-2.5 bg-[#1f5f2e] text-white rounded-xl font-bold hover:bg-[#1a4a24] transition-all shadow-md active:scale-95"
                    >
                      {i18n.language === 'ar' ? 'استشارة جديدة مع هذا الخبير' : 'Nouvelle consultation avec cet expert'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#fafaf7]">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#e5e7eb] mb-4">
                <span className="material-symbols-outlined text-5xl text-[#1f5f2e]/40">forum</span>
              </div>
              <p className="font-medium text-gray-500">
                {i18n.language === 'ar' ? 'اختر استشارة من القائمة للبدء' : 'Sélectionnez une consultation dans la liste pour commencer'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center bg-[#fafaf7]">
              <h3 className="font-bold text-xl text-gray-900">{i18n.language === 'ar' ? 'اقتراح منتج' : 'Recommander un produit'}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 border-b border-[#e5e7eb] bg-white">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input 
                  type="text" 
                  placeholder={i18n.language === 'ar' ? 'ابحث عن منتج...' : 'Rechercher un produit...'}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#1f5f2e]/30 focus:border-[#1f5f2e] transition-all"
                  dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {marketplaceProducts.length === 0 && loading ? (
                <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1f5f2e] border-t-transparent"></div>
                  <span>Loading...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-5xl">inventory_2</span>
                  <p className="font-medium text-gray-600">{i18n.language === 'ar' ? 'لا يوجد أي منتج' : 'Aucun produit trouvé'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-[#e5e7eb] flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className={`font-bold text-sm text-gray-900 line-clamp-1 ${i18n.language === 'ar' ? 'text-right' : ''}`}>{p.name}</h4>
                        <p className={`text-[#1f5f2e] font-black text-xs ${i18n.language === 'ar' ? 'text-right' : ''}`}>{p.price} MAD</p>
                      </div>
                      <button 
                        onClick={() => handleRecommendProduct(p)}
                        className="px-4 py-2 bg-[#eef6ee] text-[#1f5f2e] hover:bg-[#1f5f2e] hover:text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {i18n.language === 'ar' ? 'اختيار' : 'Sélectionner'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-xl text-red-600 flex items-center gap-2">
                <span className="material-symbols-outlined">report</span>
                {i18n.language === 'ar' ? 'الإبلاغ عن مشكلة' : 'Signaler un problème'}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 bg-white">
              {reportSuccess ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                  <p className="font-bold text-lg text-gray-900 mb-6">
                    {i18n.language === 'ar' ? 'تم إرسال البلاغ بنجاح.' : 'Signalement envoyé avec succès.'}
                  </p>
                  <button 
                    onClick={() => { setShowReportModal(false); setReportSuccess(false); }}
                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors"
                  >
                    {i18n.language === 'ar' ? 'إغلاق' : 'Fermer'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-sm font-bold text-gray-700 mb-2 ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                      {i18n.language === 'ar' ? 'سبب الإبلاغ' : 'Raison du signalement'}
                    </label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none text-sm transition-all"
                      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <option value="" disabled>{i18n.language === 'ar' ? 'اختر سبباً...' : 'Sélectionnez une raison...'}</option>
                      <option value="inappropriate">{i18n.language === 'ar' ? 'سلوك غير مناسب' : 'Comportement inapproprié'}</option>
                      <option value="bad_recommendation">{i18n.language === 'ar' ? 'توصية غير مناسبة' : 'Mauvaise recommandation'}</option>
                      <option value="delayed_response">{i18n.language === 'ar' ? 'تأخر في الرد' : 'Retard de réponse'}</option>
                      <option value="other">{i18n.language === 'ar' ? 'سبب آخر' : 'Autre'}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-bold text-gray-700 mb-2 ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                      {i18n.language === 'ar' ? 'تفاصيل إضافية' : 'Détails supplémentaires'}
                    </label>
                    <textarea 
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-28 resize-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none text-sm transition-all"
                      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                      placeholder={i18n.language === 'ar' ? 'يرجى تقديم مزيد من التفاصيل...' : 'Veuillez fournir plus de détails...'}
                    ></textarea>
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowReportModal(false)}
                      className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                    >
                      {i18n.language === 'ar' ? 'إلغاء' : 'Annuler'}
                    </button>
                    <button 
                      type="submit" 
                      disabled={!reportReason}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors text-sm shadow-sm"
                    >
                      {i18n.language === 'ar' ? 'إرسال' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-yellow-100 flex justify-between items-center bg-yellow-50">
              <h3 className="font-bold text-xl text-yellow-700 flex items-center gap-2">
                <span className="material-symbols-outlined filled">star</span>
                {i18n.language === 'ar' ? 'تقييم الخبير' : 'Évaluer l’expert'}
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 bg-white">
              {reviewSuccess ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                  <p className="font-bold text-lg text-gray-900 mb-6">
                    {i18n.language === 'ar' ? 'تم إرسال تقييمك بنجاح.' : 'Votre évaluation a été envoyée.'}
                  </p>
                  <button 
                    onClick={() => { setShowReviewModal(false); setReviewSuccess(false); }}
                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors"
                  >
                    {i18n.language === 'ar' ? 'إغلاق' : 'Fermer'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <div className="text-center py-4">
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      {i18n.language === 'ar' ? 'ما هو تقييمك؟' : 'Quelle est votre note ?'}
                    </label>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`material-symbols-outlined text-5xl transition-all ${
                            star <= reviewRating ? 'text-yellow-400 filled scale-110' : 'text-gray-200 hover:text-yellow-200 hover:scale-110'
                          }`}
                        >
                          star
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-bold text-gray-700 mb-2 ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                      {i18n.language === 'ar' ? 'تعليقك (اختياري)' : 'Votre commentaire (optionnel)'}
                    </label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-24 resize-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none text-sm transition-all"
                      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                      placeholder={i18n.language === 'ar' ? 'اكتب تجربتك مع الخبير...' : 'Partagez votre expérience...'}
                    ></textarea>
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowReviewModal(false)}
                      className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                    >
                      {i18n.language === 'ar' ? 'إلغاء' : 'Annuler'}
                    </button>
                    <button 
                      type="submit" 
                      disabled={reviewRating === 0}
                      className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm"
                    >
                      {i18n.language === 'ar' ? 'إرسال التقييم' : 'Envoyer l’évaluation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ExpertChat;
