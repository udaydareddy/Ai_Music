// Enhanced animations and interactive effects
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    createFloatingNotes();
    setupEnhancedInteractions();
});

function initializeAnimations() {
    // Staggered card animations
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.animation = `cardSlideUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards ${index * 0.2}s`;
    });

    // Animate form elements
    const formElements = document.querySelectorAll('.form-control, .form-select, .form-range');
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        }, 300 + index * 100);
    });

    // Button pulse effect
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('mouseenter', function() {
            this.style.animation = 'pulse 0.6s ease-in-out';
        });
        generateBtn.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    }
}

function createFloatingNotes() {
    const noteSymbols = ['♪', '♫', '♬', '♩', '♭', '♯'];
    
    setInterval(() => {
        const note = document.createElement('div');
        note.className = 'floating-note';
        note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        note.style.left = Math.random() * 100 + 'vw';
        note.style.animationDuration = (8 + Math.random() * 4) + 's';
        note.style.fontSize = (1.5 + Math.random()) + 'rem';
        
        document.body.appendChild(note);
        
        setTimeout(() => {
            note.remove();
        }, 12000);
    }, 3000);
}

function setupEnhancedInteractions() {
    // Enhanced slider interactions
    const sliders = document.querySelectorAll('.form-range');
    sliders.forEach(slider => {
        slider.addEventListener('input', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(102, 126, 234, 0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = e.offsetX + 'px';
            ripple.style.top = e.offsetY + 'px';
            
            this.style.position = 'relative';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Enhanced form validation with animations
    const form = document.getElementById('musicForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const button = this.querySelector('button[type="submit"]');
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    }
}

// Enhanced loading animations
function generateMusic() {
    showEnhancedLoading();
    
    // ... existing generateMusic code ...
    const formData = {
        num_notes: parseInt(document.getElementById('numNotes').value),
        temperature: parseFloat(document.getElementById('temperature').value),
        tempo: parseInt(document.getElementById('tempo').value),
        seed: document.getElementById('seed').value || null
    };
    
    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        hideEnhancedLoading();
        if (data.success) {
            showResultWithAnimation(data);
        } else {
            showErrorWithAnimation(data.error || 'Failed to generate music');
        }
    })
    .catch(error => {
        hideEnhancedLoading();
        showErrorWithAnimation('Network error: ' + error.message);
    });
}

function showEnhancedLoading() {
    const loadingDiv = document.getElementById('loadingDiv');
    const generateBtn = document.getElementById('generateBtn');
    
    loadingDiv.style.display = 'block';
    loadingDiv.style.animation = 'slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    // Enhanced loading messages with typewriter effect
    const loadingTexts = [
        "🎵 AI is analyzing musical patterns...",
        "🎹 Creating beautiful note sequences...",
        "🎼 Composing your unique melody...",
        "🎧 Preparing audio output..."
    ];
    
    let textIndex = 0;
    const loadingTextElement = loadingDiv.querySelector('p');
    
    const textInterval = setInterval(() => {
        typeWriter(loadingTextElement, loadingTexts[textIndex], 50);
        textIndex = (textIndex + 1) % loadingTexts.length;
    }, 2000);
    
    // Store interval for cleanup
    loadingDiv.dataset.textInterval = textInterval;
}

function hideEnhancedLoading() {
    const loadingDiv = document.getElementById('loadingDiv');
    const generateBtn = document.getElementById('generateBtn');
    
    // Clear text interval
    clearInterval(loadingDiv.dataset.textInterval);
    
    loadingDiv.style.animation = 'slideOut 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
    setTimeout(() => {
        loadingDiv.style.display = 'none';
    }, 300);
    
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate AI Music';
}

function typeWriter(element, text, speed = 100) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

function showResultWithAnimation(data) {
    const resultDiv = document.getElementById('resultDiv');
    
    // Hide first, then show with animation
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(30px) scale(0.95)';
    resultDiv.style.display = 'block';
    
    // Update content
    updateResultContent(data);
    
    // Animate in
    setTimeout(() => {
        resultDiv.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'translateY(0) scale(1)';
    }, 100);
    
    // Create success particle effect
    createSuccessParticles();
    
    // Scroll to result with smooth animation
    setTimeout(() => {
        resultDiv.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 500);
}

function createSuccessParticles() {
    const colors = ['#667eea', '#764ba2', '#48bb78', '#ed8936'];
    const symbols = ['🎵', '🎶', '🎼', '🎹', '🎧'];
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                color: ${colors[Math.floor(Math.random() * colors.length)]};
                font-size: ${Math.random() * 20 + 15}px;
                pointer-events: none;
                z-index: 9999;
                animation: particleExplode 1.5s ease-out forwards;
            `;
            particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            
            document.body.appendChild(particle);
            
            // Random direction
            const angle = (Math.random() * 360) * Math.PI / 180;
            const velocity = Math.random() * 150 + 50;
            particle.style.setProperty('--dx', Math.cos(angle) * velocity + 'px');
            particle.style.setProperty('--dy', Math.sin(angle) * velocity + 'px');
            
            setTimeout(() => particle.remove(), 1500);
        }, i * 50);
    }
}

function updateResultContent(data) {
    // Handle audio playback with enhanced animations
    const audioPlayer = document.getElementById('audioPlayer');
    const midiPlayerSection = document.getElementById('midiPlayerSection');
    
    if (data.audio_url && data.audio_url.endsWith('.wav')) {
        audioPlayer.src = data.audio_url;
        audioPlayer.style.display = 'block';
        if (midiPlayerSection) midiPlayerSection.style.display = 'none';
        
        audioPlayer.addEventListener('loadeddata', function() {
            this.style.animation = 'audioGlow 2s ease-in-out infinite alternate';
        });
    } else {
        audioPlayer.style.display = 'none';
        if (midiPlayerSection) midiPlayerSection.style.display = 'block';
    }
    
    // Update download links with animation
    const downloadMidi = document.getElementById('downloadMidi');
    const downloadAudio = document.getElementById('downloadAudio');
    
    downloadMidi.href = data.midi_url;
    downloadMidi.style.animation = 'buttonGlow 2s ease-in-out infinite alternate';
    
    if (data.audio_url) {
        downloadAudio.href = data.audio_url;
        downloadAudio.style.display = 'inline-block';
        downloadAudio.style.animation = 'buttonGlow 2s ease-in-out infinite alternate 0.5s';
    }
    
    // Animate composition details
    const details = document.getElementById('compositionDetails');
    details.innerHTML = `
        <li style="animation: slideInLeft 0.6s ease-out 0.2s both;"><i class="fas fa-music"></i> <strong>Notes:</strong> ${data.total_notes}</li>
        <li style="animation: slideInLeft 0.6s ease-out 0.4s both;"><i class="fas fa-palette"></i> <strong>Creativity:</strong> ${data.parameters.temperature}</li>
        <li style="animation: slideInLeft 0.6s ease-out 0.6s both;"><i class="fas fa-tachometer-alt"></i> <strong>Tempo:</strong> ${data.parameters.tempo} BPM</li>
    `;
    
    // Animate note preview with typing effect
    const notesPreview = document.getElementById('notesPreview');
    const noteText = data.notes_preview.join(' → ') + ' → ...';
    typeWriter(notesPreview, noteText, 30);
}

function showErrorWithAnimation(message) {
    const errorDiv = document.getElementById('errorDiv');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.animation = 'shake 0.5s ease-in-out, slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 8000);
}

// Add CSS animations dynamically
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    
    @keyframes particleExplode {
        from {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
        }
        to {
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes audioGlow {
        0% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
        100% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.6); }
    }
    
    @keyframes buttonGlow {
        0% { box-shadow: 0 0 10px rgba(102, 126, 234, 0.2); }
        100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.4); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(enhancedStyles);

// Update slider values with animations
document.getElementById('numNotes').addEventListener('input', function() {
    const valueSpan = document.getElementById('notesValue');
    valueSpan.style.animation = 'pulse 0.3s ease-out';
    valueSpan.textContent = this.value;
    setTimeout(() => valueSpan.style.animation = '', 300);
});

document.getElementById('tempo').addEventListener('input', function() {
    const valueSpan = document.getElementById('tempoValue');
    valueSpan.style.animation = 'pulse 0.3s ease-out';
    valueSpan.textContent = this.value;
    setTimeout(() => valueSpan.style.animation = '', 300);
});

// Form submission with animation
document.getElementById('musicForm').addEventListener('submit', function(e) {
    e.preventDefault();
    generateMusic();
});

// Enhanced functions for existing functionality
function generateAnother() {
    const resultDiv = document.getElementById('resultDiv');
    const errorDiv = document.getElementById('errorDiv');
    
    resultDiv.style.animation = 'slideOut 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
    errorDiv.style.animation = 'slideOut 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
    
    setTimeout(() => {
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
    }, 300);
    
    document.getElementById('musicForm').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Enhanced download functions
function downloadAndPlay() {
    const midiUrl = document.getElementById('downloadMidi').href;
    const button = event.target.closest('button');
    
    // Button animation
    button.style.transform = 'scale(0.95)';
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    
    const link = document.createElement('a');
    link.href = midiUrl;
    link.download = 'ai_generated_music.mid';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        button.style.transform = '';
        button.innerHTML = '<i class="fas fa-download"></i> Download & Play';
        showSuccess('MIDI file downloaded! Open it with Windows Media Player or your favorite music software to hear your AI composition.');
    }, 1000);
}

function showSuccess(message) {
    let successDiv = document.getElementById('successDiv');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'successDiv';
        successDiv.className = 'alert alert-success mt-4';
        successDiv.innerHTML = '<strong><i class="fas fa-check-circle"></i> Success:</strong> <span id="successMessage"></span>';
        document.getElementById('errorDiv').parentNode.insertBefore(successDiv, document.getElementById('errorDiv').nextSibling);
    }
    
    document.getElementById('successMessage').textContent = message;
    successDiv.style.display = 'block';
    successDiv.style.animation = 'slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
        setTimeout(() => successDiv.style.display = 'none', 300);
    }, 6000);
}
