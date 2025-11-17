document.getElementById('method').addEventListener('change', function() {
    const method = this.value;
    const ivLabel = document.getElementById('iv-label');
    const ivInput = document.getElementById('iv');
    const privateKeyLabel = document.getElementById('private-key-label');
    const privateKeyInput = document.getElementById('private-key');
    
    // Hide/show fields based on method
    if (method === 'aes') {
        ivLabel.style.display = 'block';
        ivInput.style.display = 'block';
        privateKeyLabel.style.display = 'none';
        privateKeyInput.style.display = 'none';
    } else if (method === 'rsa') {
        ivLabel.style.display = 'none';
        ivInput.style.display = 'none';
        privateKeyLabel.style.display = 'block';
        privateKeyInput.style.display = 'block';
    } else {
        ivLabel.style.display = 'none';
        ivInput.style.display = 'none';
        privateKeyLabel.style.display = 'none';
        privateKeyInput.style.display = 'none';
    }
});

// Handle word clicks to auto-fill key
document.querySelectorAll('.word').forEach(word => {
    word.addEventListener('click', function() {
        document.getElementById('key').value = this.getAttribute('data-word');
    });
});

// Handle audio upload and decoding with sanitization
document.getElementById('audio-btn').addEventListener('click', function() {
    document.getElementById('audio-input').click();
});

document.getElementById('audio-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const status = document.getElementById('audio-status');
    
    if (!file) {
        status.textContent = 'No file selected.';
        return;
    }
    
    // Sanitize: Check file type (audio only)
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
        status.textContent = 'Invalid file type. Please upload an audio file (e.g., WAV, MP3).';
        return;
    }
    
    // Sanitize: Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        status.textContent = 'File too large. Please upload a file smaller than 10MB.';
        return;
    }
    
    status.textContent = 'Processing audio...';
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();
    
    reader.onload = function(e) {
        audioContext.decodeAudioData(e.target.result, function(buffer) {
            try {
                const morseText = decodeAudioToMorse(buffer);
                document.getElementById('input').value = morseText;
                status.textContent = 'Morse code decoded and filled in input field.';
            } catch (err) {
                status.textContent = 'Error processing audio: ' + err.message;
            }
        }, function(err) {
            status.textContent = 'Error decoding audio file: ' + err.message + '. Ensure the file is a valid audio format.';
        });
    };
    
    reader.onerror = function() {
        status.textContent = 'Error reading file. Please try again.';
    };
    
    reader.readAsArrayBuffer(file);
});

// Function to decode audio buffer to Morse code
function decodeAudioToMorse(buffer) {
    const channelData = buffer.getChannelData(0); // Use first channel
    const sampleRate = buffer.sampleRate;
    const threshold = 0.1; // Amplitude threshold for beep detection
    const dotDuration = sampleRate * 0.1; // Assume ~100ms for dot
    const dashDuration = sampleRate * 0.3; // Assume ~300ms for dash
    const letterPause = sampleRate * 0.5; // Pause for letter separator
    const wordPause = sampleRate * 1.5; // Pause for word separator
    
    let morse = '';
    let inBeep = false;
    let beepStart = 0;
    let lastEnd = 0;
    
    for (let i = 0; i < channelData.length; i++) {
        const amplitude = Math.abs(channelData[i]);
        
        if (amplitude > threshold && !inBeep) {
            inBeep = true;
            beepStart = i;
        } else if (amplitude <= threshold && inBeep) {
            inBeep = false;
            const duration = i - beepStart;
            
            if (duration < dotDuration) {
                morse += '.';
            } else if (duration < dashDuration) {
                morse += '-';
            } else {
                morse += '-'; // Long beep as dash
            }
            
            const pause = i - lastEnd;
            if (pause > wordPause) {
                morse += ' / ';
            } else if (pause > letterPause) {
                morse += ' ';
            }
            lastEnd = i;
        }
    }
    
    return morse.trim();
}

document.getElementById('decrypt-btn').addEventListener('click', function() {
    const method = document.getElementById('method').value;
    const input = document.getElementById('input').value;
    const key = document.getElementById('key').value;
    const output = document.getElementById('output');
    
    let result = '';
    
    try {
        switch (method) {
            case 'caesar':
                result = caesarDecrypt(input, parseInt(key) || 0);
                break;
            case 'vigenere':
                result = vigenereDecrypt(input, key);
                break;
            case 'rot13':
                result = rot13Decrypt(input);
                break;
            case 'xor':
                result = xorDecrypt(input, key);
                break;
            case 'atbash':
                result = atbashDecrypt(input);
                break;
            case 'railfence':
                result = railFenceDecrypt(input, parseInt(key) || 3);
                break;
            case 'base64':
                result = base64Decrypt(input);
                break;
            case 'morse':
                result = morseDecrypt(input);
                break;
            case 'aes':
                const iv = document.getElementById('iv').value;
                result = aesDecrypt(input, key, iv);
                break;
            case 'des':
                result = desDecrypt(input, key);
                break;
            case 'blowfish':
                result = blowfishDecrypt(input, key);
                break;
            case 'rsa':
                const privateKey = document.getElementById('private-key').value;
                result = rsaDecrypt(input, privateKey);
                break;
            default:
                result = 'Invalid method selected.';
        }
    } catch (e) {
        result = 'Error: ' + e.message;
    }
    
    output.textContent = result;
});

// Caesar Cipher Decrypt
function caesarDecrypt(text, shift) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            return String.fromCharCode(((code - base - shift) % 26 + 26) % 26 + base);
        }
        return char;
    }).join('');
}

// Vigenère Cipher Decrypt
function vigenereDecrypt(text, keyword) {
    const key = keyword.toLowerCase().replace(/[^a-z]/g, '');
    let keyIndex = 0;
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            const shift = key.charCodeAt(keyIndex % key.length) - 97;
            keyIndex++;
            return String.fromCharCode(((code - base - shift) % 26 + 26) % 26 + base);
        }
        return char;
    }).join('');
}

// ROT13 Decrypt (same as encrypt, since it's symmetric)
function rot13Decrypt(text) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            return String.fromCharCode(((code - base + 13) % 26) + base);
        }
        return char;
    }).join('');
}

// XOR Cipher Decrypt (same as encrypt, since it's symmetric)
function xorDecrypt(text, key) {
    return text.split('').map((char, i) => {
        const keyChar = key[i % key.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
}

// Atbash Cipher Decrypt (same as encrypt, since it's symmetric)
function atbashDecrypt(text) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            return String.fromCharCode(base + (25 - (code - base)));
        }
        return char;
    }).join('');
}

// Rail Fence Cipher Decrypt
function railFenceDecrypt(text, rails) {
    const len = text.length;
    const rail = Array.from({ length: rails }, () => []);
    let down = false;
    let row = 0;
    
    // Build the rail pattern
    for (let i = 0; i < len; i++) {
        rail[row].push(i);
        if (row === 0 || row === rails - 1) down = !down;
        row += down ? 1 : -1;
    }
    
    // Fill rails with text
    let idx = 0;
    for (let r = 0; r < rails; r++) {
        for (let i = 0; i < rail[r].length; i++) {
            rail[r][i] = text[idx++];
        }
    }
    
    // Read off the rails
    const result = [];
    row = 0;
    down = false;
    for (let i = 0; i < len; i++) {
        result[rail[row].shift()] = text[i];
        if (row === 0 || row === rails - 1) down = !down;
        row += down ? 1 : -1;
    }
    
    return result.join('');
}

// Base64 Decrypt (decode)
function base64Decrypt(text) {
    try {
        return atob(text);
    } catch (e) {
        return 'Invalid Base64 input.';
    }
}

// Morse Code Decrypt
function morseDecrypt(text) {
    const morseToChar = {
        '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
        '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
        '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
        '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
        '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
        '--..': 'Z', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
        '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9',
        '-----': '0'
    };
    
    return text.split(' ').map(code => {
        if (code === '/') return ' '; // Word separator
        return morseToChar[code] || '?'; // Unknown code as ?
    }).join('');
}

// AES Decrypt (assumes input is base64, key/iv as strings)
function aesDecrypt(encrypted, key, iv) {
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: CryptoJS.enc.Hex.parse(iv) });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// DES Decrypt (assumes input is base64, key as string)
function desDecrypt(encrypted, key) {
    const decrypted = CryptoJS.DES.decrypt(encrypted, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// Blowfish Decrypt (assumes input is base64, key as string)
function blowfishDecrypt(encrypted, key) {
    const decrypted = CryptoJS.Blowfish.decrypt(encrypted, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// RSA Decrypt (simplified; assumes input is base64, private key in PEM)
function rsaDecrypt(encrypted, privateKeyPem) {
    // This is a basic implementation using jsbn; for real use, use a proper library like node-forge
    const rsa = new RSAKey();
    rsa.readPrivateKeyFromPEMString(privateKeyPem);
    const decrypted = rsa.decrypt(encrypted); // Assumes encrypted is base64
    return decrypted;
}