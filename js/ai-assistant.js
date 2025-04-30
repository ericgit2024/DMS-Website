// AI Assistant Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements with error checking
    const aiButton = document.getElementById('ai-assistant-button');
    const aiPanel = document.getElementById('ai-assistant-panel');
    const closeButton = document.getElementById('close-assistant');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const openAssistantBtn = document.getElementById('open-assistant-btn');
    const questionChips = document.querySelectorAll('.question-chip');

    // Verify all required elements are present
    if (!aiButton) console.error('AI Button not found');
    if (!aiPanel) console.error('AI Panel not found');
    if (!closeButton) console.error('Close Button not found');
    if (!chatMessages) console.error('Chat Messages container not found');
    if (!userInput) console.error('User Input not found');
    if (!sendButton) console.error('Send Button not found');
    if (!openAssistantBtn) console.error('Open Assistant Button not found');

    // Sample disaster-related knowledge base for the AI
    const knowledgeBase = {
        "emergency kit": [
            "An emergency kit should include:",
            "- Water (one gallon per person per day for at least three days)",
            "- Non-perishable food (at least a three-day supply)",
            "- Battery-powered radio and extra batteries",
            "- Flashlight and extra batteries",
            "- First aid kit",
            "- Whistle to signal for help",
            "- Dust mask, plastic sheeting, and duct tape",
            "- Moist towelettes, garbage bags, and plastic ties for personal sanitation",
            "- Wrench or pliers to turn off utilities",
            "- Manual can opener",
            "- Local maps",
            "- Cell phone with chargers and a backup battery",
            "- Prescription medications and glasses",
            "- Infant formula and diapers",
            "- Pet food and extra water for your pet",
            "- Important family documents in a waterproof container"
        ],
        "earthquake": [
            "During an earthquake:",
            "- DROP to the ground (before the earthquake drops you)",
            "- COVER your head and neck with your arms and take cover under a sturdy table if possible",
            "- HOLD ON to your shelter until the shaking stops",
            "- Stay away from glass, windows, outside doors and walls",
            "- Do not use elevators",
            "- If outdoors, stay in the open away from buildings, streetlights, and utility wires",
            "- If in a vehicle, stop in a clear area away from buildings, trees, overpasses, and utility wires"
        ],
        "hurricane": [
            "To prepare for a hurricane:",
            "- Create an emergency plan and discuss it with your family",
            "- Know your evacuation route and prepare an emergency kit",
            "- Secure your home: trim trees, reinforce roof, windows, and doors",
            "- Have a portable radio to receive updates",
            "- Fill your car's gas tank and stock up on cash",
            "- Bring outdoor furniture inside",
            "- Turn refrigerator and freezer to coldest settings",
            "- Follow evacuation orders immediately if issued",
            "- If unable to evacuate, stay indoors away from windows"
        ],
        "flood": [
            "For flood safety:",
            "- Evacuate if told to do so",
            "- Move to higher ground or a higher floor",
            "- Do not walk, swim, or drive through flood waters",
            "- Stay off bridges over fast-moving water",
            "- Disconnect utilities and appliances if safe to do so",
            "- Avoid contact with floodwater—it may be contaminated",
            "- Do not enter a room if water covers electrical outlets"
        ],
        "wildfire": [
            "For wildfire safety:",
            "- Create a defensible space around your home",
            "- Use fire-resistant materials for home construction/renovation",
            "- Have emergency supplies ready and evacuation plan in place",
            "- If ordered to evacuate, do so immediately",
            "- Close all windows, vents, and doors to prevent embers",
            "- Remove flammable items from around the house",
            "- Turn on lights to make the house visible in heavy smoke",
            "- If trapped, call 911 and let them know your location"
        ],
        "report emergency": [
            "To report an emergency:",
            "- For immediate life-threatening emergencies, call 911",
            "- For disaster-related emergencies, call our 24/7 hotline: 1-800-DISASTER",
            "- You can also report emergencies through our website's emergency reporting form",
            "- Have your location and situation details ready when reporting"
        ],
        "response time": [
            "Our response times vary based on:",
            "- The severity and type of emergency",
            "- Current demand and resource availability",
            "- Your location relative to our response teams",
            "- Weather and road conditions",
            "Priority is always given to life-threatening situations"
        ],
        "volunteer": [
            "To become a volunteer:",
            "- Register through our volunteer signup page",
            "- Complete the required training programs",
            "- Specify your skills and availability",
            "- Provide emergency contact information",
            "- Agree to our volunteer terms and conditions",
            "Contact our volunteer coordinator at volunteer@disasterguard.org for more information"
        ],
        "alerts": [
            "To receive disaster alerts:",
            "- Sign up for our newsletter on the website",
            "- Enable notifications on our mobile app",
            "- Follow our social media channels",
            "- Register your phone number for SMS alerts",
            "You can customize alert types and frequency in your account settings"
        ],
        "contact": [
            "You can contact DisasterGuard through:",
            "- Emergency Hotline: 1-800-DISASTER (24/7)",
            "- Email: help@disasterguard.org",
            "- Website contact form",
            "- Visit our headquarters (location available on our contact page)",
            "For emergencies, always call the hotline instead of using email"
        ],
        // Added FAQ questions from the contact page
        "best way to report an emergency": [
            "For immediate emergencies, always call 911 first.",
            "Our emergency hotline (1-800-DISASTER) is for disaster-related information and non-life-threatening situations.",
            "You can also use the emergency reporting form on our website for non-urgent reports."
        ],
        "how quickly will i receive a response": [
            "We aim to respond to all inquiries within 24-48 hours during normal business days.",
            "Emergency-related queries are prioritized and typically receive faster responses.",
            "For urgent matters, please use our emergency hotline instead of email or contact forms."
        ],
        "can i volunteer": [
            "Yes! We welcome volunteers to help with disaster response.",
            "Please visit our Volunteer page to register as a volunteer and learn about training opportunities.",
            "Volunteering opportunities include emergency response, community education, and administrative support."
        ],
        "get disaster alerts": [
            "You can receive location-specific disaster notifications by:",
            "- Visiting our Alerts page and subscribing with your location information",
            "- Downloading our mobile app and enabling notifications",
            "- Signing up for SMS alerts with your phone number",
            "- Following our social media channels for general updates"
        ]
    };
    
    // Toggle AI assistant panel with error handling
    function toggleAssistant(event) {
        if (event) {
            event.preventDefault(); // Prevent default behavior for links
        }
        
        if (!aiPanel) {
            console.error('Cannot toggle AI panel - element not found');
            return;
        }

        aiPanel.classList.toggle('active');
        
        // Log the current state
        console.log('AI Panel state:', aiPanel.classList.contains('active') ? 'open' : 'closed');
        
        if (aiPanel.classList.contains('active') && userInput) {
            userInput.focus();
        }
    }

    // Add event listeners with error handling
    if (aiButton) {
        aiButton.addEventListener('click', toggleAssistant);
    }
    
    if (openAssistantBtn) {
        openAssistantBtn.addEventListener('click', toggleAssistant);
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', toggleAssistant);
    }

    // Handle sending messages
    function sendMessage(message) {
        if (!message.trim()) return;

        // Add user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user';
        userMessageDiv.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        chatMessages.appendChild(userMessageDiv);

        // Clear input
        userInput.value = '';

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = getAIResponse(message);
            const formattedResponse = aiResponse.split('\n').map(line => line.trim()).join('\n');
            const aiMessageDiv = document.createElement('div');
            aiMessageDiv.className = 'message ai';
            aiMessageDiv.innerHTML = `
                <div class="message-content">
                    <p>${formattedResponse}</p>
                </div>
            `;
            chatMessages.appendChild(aiMessageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

    // Handle send button click
    sendButton.addEventListener('click', () => {
        sendMessage(userInput.value);
    });

    // Handle enter key press
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(userInput.value);
        }
    });

    // Handle suggested questions
    questionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const question = chip.getAttribute('data-question');
            userInput.value = question;
            sendMessage(question);
        });
    });

    // Improved AI response function with better pattern matching
    function getAIResponse(message) {
        message = message.toLowerCase();
        
        // Check for keywords in the message
        for (const [key, response] of Object.entries(knowledgeBase)) {
            if (message.includes(key)) {
                return response.join('\n');
            }
        }

        // Check for common variations of questions
        if (message.includes('emergency') && (message.includes('call') || message.includes('contact'))) {
            return knowledgeBase['report emergency'].join('\n');
        }
        if (message.includes('how long') || message.includes('when will') || message.includes('wait time')) {
            return knowledgeBase['response time'].join('\n');
        }
        if (message.includes('help') || message.includes('volunteer') || message.includes('join')) {
            return knowledgeBase['volunteer'].join('\n');
        }
        if (message.includes('notification') || message.includes('alert') || message.includes('update')) {
            return knowledgeBase['alerts'].join('\n');
        }
        if (message.includes('reach') || message.includes('contact') || message.includes('phone')) {
            return knowledgeBase['contact'].join('\n');
        }
        // FAQ specific patterns
        if (message.includes('report') && message.includes('emergency')) {
            return knowledgeBase['best way to report an emergency'].join('\n');
        }
        if (message.includes('response') && (message.includes('time') || message.includes('quick') || message.includes('fast'))) {
            return knowledgeBase['how quickly will i receive a response'].join('\n');
        }
        if (message.includes('volunteer') || message.includes('volunteering') || message.includes('help out')) {
            return knowledgeBase['can i volunteer'].join('\n');
        }
        if (message.includes('get') && message.includes('alerts')) {
            return knowledgeBase['get disaster alerts'].join('\n');
        }

        return "I'm here to help with disaster preparedness and emergency information. You can ask me about:\n" +
               "- Emergency kit contents\n" +
               "- What to do during specific disasters (earthquakes, floods, cyclones, etc.)\n" +
               "- How to report emergencies\n" +
               "- Volunteering opportunities\n" +
               "- How to receive alerts\n" +
               "- Our contact information\n" +
               "- Response times for inquiries";
    }

    function connectToAIService(message) {
        // This function would connect to a real AI service
        // For now, we're using the simple pattern matching above
        console.log('Would connect to AI service with message:', message);
        return getAIResponse(message);
    }

    // Function to create question buttons from knowledge base
    function createQuestionButtons() {
        const questionButtonsContainer = document.getElementById('question-buttons');
        if (!questionButtonsContainer) return;

        // Clear existing buttons
        questionButtonsContainer.innerHTML = '';

        // Create a button for each topic in the knowledge base
        const topics = [
            { text: "What should be in an emergency kit?", key: "emergency kit" },
            { text: "What to do during an earthquake?", key: "earthquake" },
            { text: "How to prepare for a hurricane?", key: "hurricane" },
            { text: "What are flood safety measures?", key: "flood" },
            { text: "How to stay safe during a wildfire?", key: "wildfire" },
            { text: "How do I report an emergency?", key: "report emergency" },
            { text: "What are your response times?", key: "response time" },
            { text: "How can I volunteer?", key: "volunteer" },
            { text: "How do I get disaster alerts?", key: "alerts" },
            { text: "How can I contact DisasterGuard?", key: "contact" },
            { text: "What's the best way to report an emergency?", key: "best way to report an emergency" },
            { text: "How quickly will I receive a response?", key: "how quickly will i receive a response" },
            { text: "Can I volunteer with DisasterGuard?", key: "can i volunteer" },
            { text: "How do I get disaster alerts?", key: "get disaster alerts" }
        ];

        topics.forEach(topic => {
            const button = document.createElement('button');
            button.className = 'question-btn';
            button.textContent = topic.text;
            button.addEventListener('click', () => {
                const response = knowledgeBase[topic.key].join('\n');
                // Add user question to chat
                const userMessageDiv = document.createElement('div');
                userMessageDiv.className = 'message user';
                userMessageDiv.innerHTML = `
                    <div class="message-content">
                        <p>${topic.text}</p>
                    </div>
                `;
                chatMessages.appendChild(userMessageDiv);

                // Add AI response
                setTimeout(() => {
                    const formattedResponse = response.split('\n').map(line => line.trim()).join('\n');
                    const aiMessageDiv = document.createElement('div');
                    aiMessageDiv.className = 'message ai';
                    aiMessageDiv.innerHTML = `
                        <div class="message-content">
                            <p>${formattedResponse}</p>
                        </div>
                    `;
                    chatMessages.appendChild(aiMessageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 500);

                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
            questionButtonsContainer.appendChild(button);
        });
    }

    // Call createQuestionButtons when the page loads
    createQuestionButtons();
}); 