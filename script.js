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
            case 'aes':
                const iv = document.getElementById('iv').value;
                result = aesDecrypt(input, key, iv);
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

// AES Decrypt (assumes input is base64, key/iv as strings)
function aesDecrypt(encrypted, key, iv) {
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: CryptoJS.enc.Hex.parse(iv) });
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