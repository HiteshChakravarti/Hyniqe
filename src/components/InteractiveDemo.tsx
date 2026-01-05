import { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const helperResponses: Record<string, string[]> = {
  dexter: [
    "Hi! I'm Dexter, your customer support specialist. I'm here to help resolve any issues quickly and efficiently. What can I assist you with today?",
    "I can help you with product inquiries, troubleshooting, order tracking, and general customer service. I'm available 24/7!",
    "I've analyzed your request and I'm here to provide the best solution. Let me know if you need any clarification.",
  ],
  marcus: [
    "Hello! I'm Marcus, your sales assistant. I specialize in qualifying leads and helping close deals. How can I help grow your business today?",
    "I can assist with lead qualification, scheduling demos, following up with prospects, and providing sales insights.",
    "Let me help you identify the best opportunities and create a winning sales strategy.",
  ],
  olivia: [
    "Hi there! I'm Olivia, your data analyst. I turn raw data into actionable insights. What would you like me to analyze?",
    "I can create reports, identify trends, perform statistical analysis, and generate data visualizations for you.",
    "I've processed thousands of data points and I'm ready to help you make data-driven decisions.",
  ],
  sophia: [
    "Hello! I'm Sophia, your email manager. I keep your inbox organized and handle communications efficiently. How can I help?",
    "I can sort emails, draft responses, schedule send times, and manage your email workflows automatically.",
    "Let me take care of your inbox so you can focus on what matters most.",
  ],
  james: [
    "Hi! I'm James, your scheduler. I manage calendars and coordinate meetings seamlessly. What would you like to schedule?",
    "I can book appointments, find optimal meeting times, send reminders, and handle time zone conversions.",
    "I'll make sure you never miss an important meeting or appointment.",
  ],
  emma: [
    "Hello! I'm Emma, your content creator. I craft engaging content that resonates with your audience. What can I create for you?",
    "I can write blog posts, social media content, product descriptions, email campaigns, and much more.",
    "Let's create content that drives engagement and achieves your goals.",
  ],
  alex: [
    "Hi there! I'm Alex, your HR assistant. I streamline recruitment and employee management. How can I assist with your HR needs?",
    "I can help with job postings, candidate screening, onboarding, and employee documentation.",
    "Let me handle the HR tasks so you can focus on building a great team culture.",
  ],
  noah: [
    "Hello! I'm Noah, your project manager. I keep projects on track and teams aligned. What project can I help you with?",
    "I can create task lists, track progress, manage deadlines, and generate project reports.",
    "I'll ensure your projects are completed on time and within scope.",
  ],
};

interface InteractiveDemoProps {
  selectedHelper: string;
}

export function InteractiveDemo({ selectedHelper }: InteractiveDemoProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Initialize with helper's first message
    const helperName = selectedHelper.charAt(0).toUpperCase() + selectedHelper.slice(1);
    const responses = helperResponses[selectedHelper] || helperResponses.dexter;
    
    setMessages([
      {
        id: '1',
        text: responses[0],
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [selectedHelper]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      const responses = helperResponses[selectedHelper] || helperResponses.dexter;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <section id="demo" className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-blue-400">Interactive Demo</span>
          </div>
          <h2 className="text-white mb-4">
            Try It Now
          </h2>
          <p className="text-gray-400 text-xl">
            Chat with your selected AI employee and see the magic happen
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-white capitalize">{selectedHelper}</h3>
                <p className="text-blue-100 text-sm">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm">Active</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-900 to-black">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 ml-2' 
                      : 'bg-gradient-to-r from-gray-700 to-gray-600 mr-2'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}>
                    <p className="leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-4 bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-xl text-white hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              This is a demo. Real AI responses may vary based on your specific use case.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
