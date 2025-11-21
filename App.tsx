import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ActionType, UserProfile, Device, DeviceOS } from './types';
import { analyzeUserIntent } from './services/geminiService';
import { getManagedDevices, getBitLockerKey, wipeDevice, resetPasscode } from './services/mockGraphService';
import { ActionCard } from './components/ActionCard';
import { DeviceSelector } from './components/DeviceSelector';

const App: React.FC = () => {
  // -- State --
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // State to handle the active workflow
  const [activeAction, setActiveAction] = useState<ActionType>(ActionType.NONE);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // -- Effects --

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // -- Handlers --

  const handleLogin = () => {
    // TODO: Replace with MSAL loginPopup() or loginRedirect()
    setIsAuthenticated(true);
    setCurrentUser({
      id: '123',
      displayName: 'Alex Doe',
      email: 'alex.doe@mondelez.com',
      jobTitle: 'Global Supply Chain Manager'
    });
    
    // Initial Greeting
    const greeting: ChatMessage = {
      id: 'init-1',
      role: 'bot',
      text: `Hello Alex. I am your Mondelez IT assistant. I can help you manage your enrolled devices. What would you like to do today?`,
      timestamp: new Date()
    };
    setMessages([greeting]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // AI Processing
    const aiResponse = await analyzeUserIntent(userText);
    setIsTyping(false);

    if (aiResponse.intent !== ActionType.NONE) {
      // AI found an intent, proceed to device selection
      startActionFlow(aiResponse.intent, aiResponse.confirmationMessage);
    } else {
      // No clear intent, just chat
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: aiResponse.confirmationMessage || "I'm here to help with your devices.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  const startActionFlow = async (action: ActionType, customMessage?: string) => {
    setActiveAction(action);
    setIsLoadingDevices(true);
    
    let text = customMessage;
    if (!text) {
        switch(action) {
            case ActionType.GET_BITLOCKER: text = "I can help you retrieve your BitLocker recovery key."; break;
            case ActionType.WIPE: text = "I can help you initiate a remote wipe for a lost or stolen device."; break;
            case ActionType.RESET_PASSCODE: text = "I can help you reset the passcode on your mobile device."; break;
            default: text = "Selecting devices...";
        }
    }

    // Add Bot Message initiating flow
    const botMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'bot',
      text: `${text} Fetching your devices...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);

    try {
      const devices = await getManagedDevices();
      setDeviceList(devices);
      setIsLoadingDevices(false);

      // Add a "System" message containing the device selector
      const selectorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: "Please select the device you want to manage:",
        timestamp: new Date(),
        requiresSelection: true,
        deviceList: devices
      };
      setMessages(prev => [...prev, selectorMsg]);
    } catch (e) {
      setIsLoadingDevices(false);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        text: "I encountered an error fetching your devices from Intune. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleDeviceSelection = async (device: Device) => {
    // Remove the selection UI from recent history visually (optional, but keeps chat clean)
    // For this demo, we just append the result.

    const workingMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        text: `Processing ${activeAction} for ${device.deviceName}...`,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, workingMsg]);

    try {
      let resultText = "";
      
      switch (activeAction) {
        case ActionType.GET_BITLOCKER:
            if (device.os !== DeviceOS.Windows) {
                throw new Error("BitLocker is only available for Windows devices.");
            }
            const key = await getBitLockerKey(device.id);
            resultText = `Success. Here is the BitLocker Recovery Key for ${device.deviceName}:\n\n${key}`;
            break;
        case ActionType.WIPE:
            await wipeDevice(device.id);
            resultText = `Wipe command sent to ${device.deviceName}. The device will reset the next time it checks in.`;
            break;
        case ActionType.RESET_PASSCODE:
            if (device.os === DeviceOS.Windows) {
                throw new Error("Passcode reset is primarily for mobile devices (iOS/Android).");
            }
            await resetPasscode(device.id);
            resultText = `Passcode reset command sent to ${device.deviceName}. You will be prompted to set a new passcode shortly.`;
            break;
        default:
            resultText = "Action completed.";
      }

      const resultMsg: ChatMessage = {
        id: (Date.now() + 100).toString(),
        role: 'bot',
        text: resultText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, resultMsg]);
    } catch (err: any) {
        const errorMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'bot',
            text: `Error: ${err.message || "Something went wrong."}`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        // Reset flow
        setActiveAction(ActionType.NONE);
    }
  };

  // -- Render --

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mdlz-purple bg-opacity-95 relative overflow-hidden">
         {/* Decorative Background */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-black opacity-30"></div>
         </div>

        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 text-center">
           <div className="mb-6 flex justify-center">
             {/* Logo Placeholder - using text for demo */}
             <h1 className="text-3xl font-bold text-mdlz-purple tracking-tight">Mondelēz</h1>
             <span className="text-xs text-gray-400 self-end mb-1 ml-1">International</span>
           </div>
           <h2 className="text-2xl font-semibold text-gray-800 mb-2">IT Self-Service</h2>
           <p className="text-gray-500 mb-8">Manage your devices securely.</p>
           
           <button
             onClick={handleLogin}
             className="w-full bg-[#2F2F2F] text-white font-medium py-3 px-4 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
           >
             <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H10.6396V10.6396H0V0Z" fill="#F25022"/>
                <path d="M11.7725 0H22.4121V10.6396H11.7725V0Z" fill="#7FBA00"/>
                <path d="M0 11.7725H10.6396V22.4121H0V11.7725Z" fill="#00A4EF"/>
                <path d="M11.7725 11.7725H22.4121V22.4121H11.7725V11.7725Z" fill="#FFB900"/>
             </svg>
             Sign in with Entra ID
           </button>
           <p className="mt-4 text-xs text-gray-400">Powered by Intune & Tauri v2</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans overflow-hidden">
      {/* Sidebar - Hidden on small screens, visible on large */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-mdlz-purple">Mondelēz</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">IT Service Desk</p>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                     <button 
                        onClick={() => startActionFlow(ActionType.GET_BITLOCKER)}
                        className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-purple-50 hover:text-mdlz-purple transition-colors text-left"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        Get BitLocker Key
                     </button>
                     <button 
                        onClick={() => startActionFlow(ActionType.WIPE)}
                        className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-purple-50 hover:text-mdlz-purple transition-colors text-left"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Wipe Device
                     </button>
                     <button 
                        onClick={() => startActionFlow(ActionType.RESET_PASSCODE)}
                        className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-purple-50 hover:text-mdlz-purple transition-colors text-left"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Reset Passcode
                     </button>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mdlz-purple text-white flex items-center justify-center font-bold">
                    {currentUser?.displayName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.jobTitle}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header (Mobile Only) */}
        <div className="md:hidden p-4 bg-white border-b border-gray-200 flex justify-between items-center">
             <span className="font-bold text-mdlz-purple">MDLZ Support</span>
             <button onClick={() => setIsAuthenticated(false)} className="text-xs text-gray-500">Logout</button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide" ref={chatContainerRef}>
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <p>Start typing to manage your devices...</p>
             </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                 <div 
                    className={`px-5 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-mdlz-purple text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                 >
                    {msg.text}
                 </div>
                 
                 {/* If message requires device selection, render the selector component inside the chat stream */}
                 {msg.requiresSelection && msg.deviceList && (
                    <div className="mt-3 w-full md:w-96">
                        <DeviceSelector 
                            devices={msg.deviceList} 
                            onSelect={handleDeviceSelection}
                            isLoading={isLoadingDevices}
                        />
                    </div>
                 )}

                 <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
            </div>
          ))}

          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto relative flex items-center">
             <input
               type="text"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder="Type a message (e.g. 'I lost my laptop' or 'Get recovery key')..."
               className="w-full bg-gray-100 text-gray-900 placeholder-gray-500 border-0 rounded-full py-4 pl-6 pr-14 focus:ring-2 focus:ring-mdlz-purple focus:bg-white transition-all shadow-inner"
             />
             <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="absolute right-2 p-2 bg-mdlz-purple text-white rounded-full hover:bg-mdlz-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
             </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400">MDLZ AI Assistant can make mistakes. Verify device details before wiping.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;