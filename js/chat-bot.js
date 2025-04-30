document.addEventListener('DOMContentLoaded', function() {
    // Add chat bot icon to the page
    const botIcon = document.createElement('div');
    botIcon.className = 'bot-icon';
    botIcon.innerHTML = '<i class="fas fa-robot"></i>';
    document.body.appendChild(botIcon);

    // Create chat assistant panel
    const assistantPanel = document.createElement('div');
    assistantPanel.className = 'ai-assistant-panel';
    assistantPanel.innerHTML = `
        <div class="ai-header">
            <h3>AI Disaster Assistant</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="chat-area" id="chat-messages">
            <div class="message ai">
                <div class="message-content">
                    Hello! I'm your DisasterGuard AI Assistant. How can I help you prepare for or respond to disasters today?
                </div>
            </div>
        </div>
        <div class="question-buttons" id="question-buttons">
            <!-- Question buttons will be populated by JavaScript -->
        </div>
        <div class="suggested-questions" id="suggested-questions">
            <span class="question-chip" data-question="What is the best way to report an emergency?">Report emergency</span>
            <span class="question-chip" data-question="How quickly will I receive a response to my inquiry?">Response time</span>
            <span class="question-chip" data-question="Can I volunteer for disaster response?">Volunteer</span>
            <span class="question-chip" data-question="How can I get disaster alerts for my area?">Get alerts</span>
        </div>
        <div class="input-area">
            <input type="text" id="user-input" placeholder="Type your question...">
            <button class="send-btn" id="send-btn">Send</button>
        </div>
    `;
    document.body.appendChild(assistantPanel);

    // Questions and answers data
    const questions = [
        {
            text: "What should I do during a flood?",
            response: "During a flood: 1) Move to higher ground immediately, 2) Avoid walking or driving through flood waters, 3) Follow evacuation orders, 4) Turn off utilities if instructed, 5) Avoid bridges over fast-moving water."
        },
        {
            text: "How do I prepare for a cyclone?",
            response: "To prepare for a cyclone: 1) Create an emergency plan, 2) Prepare an emergency kit with food, water, and medical supplies, 3) Secure loose items outside your home, 4) Trim trees and branches, 5) Know your evacuation route, 6) Monitor weather updates."
        },
        {
            text: "What should I include in my disaster kit?",
            response: "Your disaster kit should include: 1) Water (one gallon per person per day for at least 3 days), 2) Non-perishable food (3-day supply), 3) Battery-powered radio, 4) Flashlight and extra batteries, 5) First aid kit, 6) Whistle, 7) Dust mask, 8) Plastic sheeting and duct tape, 9) Moist towelettes and garbage bags, 10) Basic tools, 11) Manual can opener, 12) Local maps, 13) Cell phone with chargers and backup battery."
        },
        {
            text: "How do I stay safe during a landslide?",
            response: "During a landslide: 1) Move quickly away from the landslide's path, 2) If indoors, take cover under a desk or strong table, 3) Stay alert and awake, 4) Listen for unusual sounds like trees cracking or boulders knocking, 5) If you suspect danger, evacuate immediately."
        },
        {
            text: "How can I volunteer during disasters?",
            response: "To volunteer: 1) Register on our platform by selecting 'Volunteer Registration' under the Register menu, 2) Provide your skills, availability, and location, 3) Complete any required training, 4) Stay informed about alerts in your area, 5) Respond to volunteer requests through your dashboard when disasters occur."
        },
        {
            text: "How do I make a donation?",
            response: "You can make a donation: 1) Visit our Donate page, 2) Choose the Chief Minister's Disaster Relief Fund, 3) Complete the payment form with your details, 4) All donations are eligible for tax exemption under Section 80G of the Income Tax Act, 5) For direct donations, visit https://donation.cmdrf.kerala.gov.in/"
        },
        {
            text: "What is the best way to report an emergency?",
            response: "To report an emergency: 1) Call 112 (National Emergency Number) for immediate assistance, 2) Use the DisasterGuard app's 'Report Emergency' feature, 3) Contact your local District Emergency Operations Centre at 1077, 4) For Kerala State Emergency Operations Centre, call 1070, 5) Provide clear information about your location and the nature of the emergency."
        },
        {
            text: "How quickly will I receive a response to my inquiry?",
            response: "Response time information: 1) Emergency reports are prioritized and responded to immediately, 2) General inquiries through the contact form are typically answered within 24-48 hours, 3) For urgent non-emergency assistance, please call our hotline at 1-800-DISASTER, 4) If you're a registered volunteer, your dashboard will show real-time status updates."
        },
        {
            text: "How can I get disaster alerts for my area?",
            response: "To get disaster alerts: 1) Create an account on DisasterGuard and set your location, 2) Enable notifications on the DisasterGuard mobile app, 3) Subscribe to our SMS alert service by texting 'ALERTKL' to 51115, 4) Follow our social media channels for updates, 5) Tune into local radio stations during emergencies."
        }
    ];

    // Add event listeners
    botIcon.addEventListener('click', toggleChatPanel);
    document.querySelector('.close-btn').addEventListener('click', toggleChatPanel);
    document.getElementById('send-btn').addEventListener('click', handleUserInput);
    document.getElementById('user-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });

    // Populate question buttons
    const questionButtonsContainer = document.getElementById('question-buttons');
    questions.slice(0, 6).forEach(question => {
        const button = document.createElement('button');
        button.classList.add('question-btn');
        button.textContent = question.text;
        button.addEventListener('click', () => handleQuestionClick(question));
        questionButtonsContainer.appendChild(button);
    });

    // Add event listeners to question chips
    const questionChips = document.querySelectorAll('.question-chip');
    questionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const questionText = this.getAttribute('data-question');
            const matchingQuestion = questions.find(q => q.text === questionText);
            
            if (matchingQuestion) {
                handleQuestionClick(matchingQuestion);
            } else {
                // If no exact match, use the chip's text as the question
                addUserMessage(questionText);
                
                // Find the best match based on the data-question attribute
                const chipQuestion = this.getAttribute('data-question');
                const response = findResponseForChip(chipQuestion);
                
                setTimeout(() => addAIResponse(response), 600);
            }
        });
    });

    // Functions
    function toggleChatPanel() {
        assistantPanel.classList.toggle('active');
    }

    function handleQuestionClick(question) {
        addUserMessage(question.text);
        setTimeout(() => addAIResponse(question.response), 600);
    }

    function findResponseForChip(chipQuestion) {
        // Look for a question that matches the chip's data-question attribute or contains similar keywords
        const lowerChipQuestion = chipQuestion.toLowerCase();
        
        // Try to find a direct match first
        const matchingQuestion = questions.find(q => q.text.toLowerCase() === lowerChipQuestion);
        if (matchingQuestion) {
            return matchingQuestion.response;
        }
        
        // Try to find a partial match based on keywords
        for (const question of questions) {
            if (containsKeywords(lowerChipQuestion, question.text.toLowerCase())) {
                return question.response;
            }
        }
        
        // Return a default response if no match is found
        return "I don't have specific information on that query. Please try one of the suggested questions or contact our support team for more assistance.";
    }

    function handleUserInput() {
        const userInput = document.getElementById('user-input');
        const text = userInput.value.trim();
        if (text) {
            addUserMessage(text);
            userInput.value = '';
            
            // Find matching question or give default response
            setTimeout(() => {
                const lowerText = text.toLowerCase();
                let foundResponse = false;
                
                // Check if input matches any predefined questions
                for (const question of questions) {
                    const lowerQuestion = question.text.toLowerCase();
                    // Check for exact match or if input contains keywords
                    if (lowerText === lowerQuestion || containsKeywords(lowerText, lowerQuestion)) {
                        addAIResponse(question.response);
                        foundResponse = true;
                        break;
                    }
                }
                
                // If no matching response was found
                if (!foundResponse) {
                    addAIResponse("I'm sorry, I don't have specific information on that. Please try asking one of the suggested questions or rephrase your query about disaster preparedness or response.");
                }
            }, 600);
        }
    }

    function addUserMessage(text) {
        const chatArea = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user');
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = text;
        
        messageDiv.appendChild(messageContent);
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function addAIResponse(text) {
        const chatArea = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'ai');
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Format numbered points with line breaks
        if (text.includes('1)') && text.includes('2)')) {
            // Split the initial part (before the numbered list) if it exists
            let prefix = '';
            if (text.includes(':')) {
                prefix = text.split(':')[0] + ':<br>';
                text = text.split(':')[1].trim();
            }
            
            // Replace numbered points with line breaks
            const formattedText = text
                .replace(/(\d+\))/g, '<br>$1')  // Add line break before each number
                .replace(/^<br>/, '');          // Remove leading line break if exists
            
            messageContent.innerHTML = prefix + formattedText;
        } else {
            messageContent.textContent = text;
        }
        
        messageDiv.appendChild(messageContent);
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function containsKeywords(userText, questionText) {
        const keywords = questionText.split(' ')
            .filter(word => word.length > 3 && !['what', 'should', 'during', 'there', 'these', 'those', 'when', 'where', 'which', 'while', 'would', 'could', 'should', 'about'].includes(word));
        
        let matchCount = 0;
        for (const keyword of keywords) {
            if (userText.includes(keyword)) {
                matchCount++;
            }
        }
        
        // Return true if at least 60% of keywords match
        return matchCount >= Math.ceil(keywords.length * 0.6);
    }
}); 