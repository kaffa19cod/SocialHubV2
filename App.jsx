import React from 'react';
import { useState } from 'react';
import { Twitter, Facebook, Bot, Calendar, Send, Loader2, CheckCircle, ImagePlus, Film, Trash2 } from 'lucide-react';

// Main App Component
export default function App() {
  // --- STATE MANAGEMENT ---
  const [postContent, setPostContent] = useState('');
  const [connectedAccounts, setConnectedAccounts] = useState({
    twitter: false,
    facebook: false,
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('las últimas tendencias en tecnología');
  const [error, setError] = useState('');
  const [view, setView] = useState('composer');
  // New states for media handling
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [facebookPostType, setFacebookPostType] = useState('Post'); // 'Post' or 'Reel'

  // --- LOGIC FUNCTIONS ---

  const toggleConnection = (platform) => {
    setConnectedAccounts(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const togglePlatformSelection = (platform) => {
    if (connectedAccounts[platform]) {
      setSelectedPlatforms(prev =>
        prev.includes(platform)
          ? prev.filter(p => p !== platform)
          : [...prev, platform]
      );
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) {
      setError('Por favor, introduce un tema para la IA.');
      return;
    }
    setIsGenerating(true);
    setError('');
    setPostContent('');

    // FIXME: This is a temporary fix to resolve the build warning.
    // For this to work, you MUST add your Gemini API Key in the line below
    // or set up environment variables correctly in your project.
    const apiKey = ""; 

    if (!apiKey) {
        setError("La clave de API de Gemini no está configurada. Por favor, añádela en el código.");
        setIsGenerating(false);
        return;
    }

    const prompt = `Escribe un post corto y atractivo para redes sociales sobre "${aiTopic}". El tono debe ser profesional pero accesible. Incluye 2-3 hashtags relevantes.`;
    
    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
          setPostContent(result.candidates[0].content.parts[0].text);
        } else {
          throw new Error("No se recibió contenido válido de la IA.");
        }
    } catch (err) {
      console.error("Error fetching from Gemini API:", err);
      setError('No se pudo generar el contenido. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    // Revoke the object URL to free up memory
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
  };

  const handleSchedulePost = () => {
    if (!postContent.trim() && !mediaFile) {
      setError('Debes añadir texto o un archivo multimedia.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Selecciona al menos una red social.');
      return;
    }

    const newPosts = selectedPlatforms.map(platform => ({
      id: Date.now() + Math.random(),
      platform,
      content: postContent,
      media: mediaFile ? { name: mediaFile.name, type: mediaFile.type } : null,
      status: 'Scheduled',
      date: new Date().toLocaleString(),
      ...(platform === 'facebook' && { postType: facebookPostType }),
    }));
    setPosts(prev => [...newPosts, ...prev]);
    
    // Reset composer state
    setPostContent('');
    handleRemoveMedia();
    setSelectedPlatforms([]);
    setError('');
    setView('scheduled');
  };
  
  // --- RENDER COMPONENTS ---

  const AccountConnector = () => (
    <div className="p-6 border-b border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">Conectar Cuentas</h2>
      <div className="space-y-3">
        <button onClick={() => toggleConnection('twitter')} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${connectedAccounts.twitter ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}>
          <div className="flex items-center gap-3"><Twitter size={20} /><span>X (Twitter)</span></div>
          {connectedAccounts.twitter && <CheckCircle size={20} />}
        </button>
        <button onClick={() => toggleConnection('facebook')} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${connectedAccounts.facebook ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}>
          <div className="flex items-center gap-3"><Facebook size={20} /><span>Página de Facebook</span></div>
          {connectedAccounts.facebook && <CheckCircle size={20} />}
        </button>
      </div>
    </div>
  );

  const MainComposer = () => (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Crear Publicación</h1>
      
      <div className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
        <label htmlFor="ai-topic" className="block text-sm font-medium text-gray-300 mb-2">Tema para la IA</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input id="ai-topic" type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Ej: beneficios del trabajo remoto" className="flex-grow bg-gray-900 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <button onClick={handleGenerateWithAI} disabled={isGenerating} className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Bot size={20} />}
            <span>{isGenerating ? 'Generando...' : 'Generar con IA'}</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Escribe tu publicación aquí..." className="w-full h-40 bg-gray-900 border border-gray-700 text-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
        <div className="absolute bottom-3 right-3 text-xs text-gray-500">{postContent.length} caracteres</div>
      </div>
      
      <div className="mt-4">
        {mediaPreview && (
          <div className="relative group w-fit mb-2">
            {mediaFile.type.startsWith('image/') ? <img src={mediaPreview} alt="Media preview" className="max-h-40 rounded-lg shadow-lg" /> : <video src={mediaPreview} controls className="max-h-40 rounded-lg shadow-lg" />}
            <button onClick={handleRemoveMedia} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
              <Trash2 size={16} />
            </button>
          </div>
        )}
        <label htmlFor="media-upload" className="cursor-pointer inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold py-2">
          <ImagePlus size={20} /><span>Añadir foto/video</span>
        </label>
        <input id="media-upload" type="file" className="hidden" onChange={handleMediaChange} accept="image/*,video/*" />
      </div>

      <div className="my-6">
        <h3 className="text-md font-semibold text-gray-300 mb-3">Publicar en:</h3>
        <div className="flex gap-4">
          <div onClick={() => togglePlatformSelection('twitter')} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedPlatforms.includes('twitter') ? 'border-blue-500 bg-blue-900/50' : 'border-gray-700 bg-gray-800'} ${!connectedAccounts.twitter ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Twitter size={20} className="text-blue-400" /> <span className="text-white">X</span>
          </div>
          <div onClick={() => togglePlatformSelection('facebook')} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedPlatforms.includes('facebook') ? 'border-indigo-500 bg-indigo-900/50' : 'border-gray-700 bg-gray-800'} ${!connectedAccounts.facebook ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Facebook size={20} className="text-indigo-400" /> <span className="text-white">Facebook</span>
          </div>
        </div>
      </div>
      
      {selectedPlatforms.includes('facebook') && (
        <div className="my-6 p-4 bg-gray-800 rounded-lg border border-gray-700 transition-all duration-300">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Opciones para Facebook</h4>
          <div className="flex gap-2">
            <button onClick={() => setFacebookPostType('Post')} className={`px-3 py-1 text-sm rounded-full transition-colors ${facebookPostType === 'Post' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Post</button>
            <button onClick={() => setFacebookPostType('Reel')} className={`px-3 py-1 text-sm rounded-full transition-colors ${facebookPostType === 'Reel' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Reel</button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <div className="flex items-center gap-4 mt-6">
        <button onClick={handleSchedulePost} disabled={(!postContent.trim() && !mediaFile) || selectedPlatforms.length === 0} className="flex-grow flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg">
          <Send size={20} /><span>Publicar / Programar</span>
        </button>
      </div>
    </div>
  );
  
  const ScheduledPosts = () => (
    <div className="p-6 md:p-8">
       <h1 className="text-3xl font-bold text-white mb-6">Publicaciones</h1>
       <div className="space-y-4">
        {posts.length === 0 ? <p className="text-gray-400 text-center py-10">Aún no hay publicaciones.</p> : posts.map(post => (
            <div key={post.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {post.platform === 'twitter' && <Twitter size={18} className="text-blue-400" />}
                  {post.platform === 'facebook' && <Facebook size={18} className="text-indigo-400" />}
                  <span className="font-bold text-white capitalize">{post.platform}</span>
                  {post.platform === 'facebook' && <span className="text-xs text-gray-400">({post.postType})</span>}
                </div>
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">{post.status}</span>
              </div>
              {post.content && <p className="text-gray-300 whitespace-pre-wrap mb-2">{post.content}</p>}
              {post.media && (
                <div className="mt-2 text-sm text-indigo-400 flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                  {post.media.type.startsWith('image/') ? <ImagePlus size={16} /> : <Film size={16} />}
                  <span>{post.media.name}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3 text-right">{post.date}</p>
            </div>
        ))}
       </div>
    </div>
  );

  return (
    <div className="bg-gray-900 text-gray-200 font-sans min-h-screen">
      <div className="md:flex">
        <aside className="w-full md:w-80 bg-gray-900/30 border-r border-gray-800 flex-shrink-0">
          <div className="p-6 border-b border-gray-700"><h1 className="text-2xl font-bold text-white">Social<span className="text-indigo-400">Hub</span></h1><p className="text-sm text-gray-400">Tu centro de mando social</p></div>
          <AccountConnector />
           <nav className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Menú</h2>
              <ul className="space-y-2">
                  <li><button onClick={() => setView('composer')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'composer' ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-gray-700'}`}><Send size={20} /><span>Compositor</span></button></li>
                  <li><button onClick={() => setView('scheduled')} className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'scheduled' ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-gray-700'}`}><Calendar size={20} /><span>Publicaciones</span></button></li>
              </ul>
          </nav>
        </aside>
        <main className="flex-1">{view === 'composer' ? <MainComposer /> : <ScheduledPosts />}</main>
      </div>
    </div>
  );
}
