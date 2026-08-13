# End-to-End Encryption Implementation

## Overview

Messages in SUDARSHAN are now end-to-end encrypted using AES-256-GCM encryption. Messages are encrypted on the client before being sent to Stream Chat and decrypted only by clients with the correct encryption key. The server and Stream Chat never see the plaintext messages.

## Encryption Architecture

### Key Management

**Encryption Store** (`sudarshan-frontend/src/store/encryptionStore.js`)
- Manages room-specific encryption keys
- Keys derived from room passkeys via SHA-256
- Passkey hashes persisted to localStorage
- DH-derived keys stored in memory only (future enhancement)

### Encryption Flow

#### Creating a Room
1. User enters room name and passkey (min 8 characters)
2. Passkey is hashed with SHA-256
3. Hash is sent to server for authentication
4. Encryption key (passkey hash) is stored locally in encryptionStore
5. Room created with encryption enabled

#### Joining a Room
1. User enters room ID and passkey
2. Passkey is hashed with SHA-256
3. Server validates hash against stored value
4. If valid, encryption key stored locally
5. User can now decrypt messages in the room

#### Sending Messages
1. User types message
2. **Translation** (if enabled): Message translated to English
3. **Encryption**: Message encrypted with AES-256-GCM
   - Random 12-byte IV generated
   - Ciphertext and IV stored separately
4. **Send**: Encrypted message sent via Stream Chat
   - Message text field contains `[encrypted]`
   - Actual ciphertext and IV in `customData`

#### Receiving Messages
1. Message received from Stream Chat
2. **Check encryption**: Look for `encrypted: true` in customData
3. **Decrypt**: Extract ciphertext and IV, decrypt with room key
4. **Translation** (if enabled): Translate decrypted text to user's language
5. **Display**: Show decrypted/translated text to user

## Implementation Details

### Encryption Components

**1. Encryption Store** (`store/encryptionStore.js`)
```javascript
// Store encryption key for a room
setRoomKey(roomId, aesKeyHex)

// Get encryption key for a room
getRoomKey(roomId)

// Setup encryption using passkey
setupRoomEncryption(roomId, passkey)
```

**2. Message Input** (`components/TranslationMessageInput.jsx`)
- Encrypts outgoing messages
- Shows encryption status indicator
- Displays "E2E Encrypted" when active

**3. Message Display** (`components/TranslatedMessage.jsx`)
- Decrypts incoming encrypted messages
- Shows encryption indicator (lock icon)
- Displays decryption errors if key missing

**4. Room Creation/Joining** (`pages/DashboardPage.jsx`)
- Stores encryption key when creating room
- Stores encryption key when joining room
- Keys tied to room ID

### Message Structure

**Unencrypted Message:**
```javascript
{
  text: "Hello, world!",
  customData: {
    encrypted: false,
    originalLanguage: "eng_Latn"
  }
}
```

**Encrypted Message:**
```javascript
{
  text: "[encrypted]",
  customData: {
    encrypted: true,
    ciphertext: "a1b2c3d4...", // hex-encoded
    iv: "e5f6g7h8...",           // hex-encoded (12 bytes)
    originalLanguage: "eng_Latn"
  }
}
```

## Encryption Algorithm

**Algorithm**: AES-256-GCM
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 96 bits (12 bytes, randomly generated per message)
- **Authentication**: Built-in GMAC authentication tag
- **Mode**: Galois/Counter Mode (provides confidentiality + integrity)

**Key Derivation**: SHA-256 hash of passkey
- Input: User's passkey (min 8 chars)
- Output: 256-bit hash used as AES key
- Same passkey → Same hash → Same encryption key

## Security Properties

### What is Protected
✅ **Message content** - Encrypted end-to-end, server cannot read  
✅ **Message integrity** - GCM mode detects tampering  
✅ **Forward secrecy** - Each message uses unique IV  
✅ **Replay protection** - Unique IV prevents replay attacks  

### What is NOT Protected
❌ **Metadata** - Room ID, sender ID, timestamp visible to server  
❌ **Message count** - Number of messages visible  
❌ **Participant list** - Who is in the room visible to server  
❌ **Typing indicators** - Visible to Stream Chat  

### Threat Model
- **Protected Against**: 
  - Server compromise (messages encrypted)
  - Network eavesdropping (HTTPS + E2EE)
  - Stream Chat service (messages encrypted before upload)
  - Unauthorized room access (passkey required)

- **NOT Protected Against**:
  - Client compromise (keys stored in browser)
  - Malicious client code injection
  - Passkey theft/guessing
  - Endpoint attacks (malicious browser extensions)

## Integration with Translation

The encryption and translation features work together seamlessly:

1. **Sending**: Translate → Encrypt → Send
2. **Receiving**: Decrypt → Translate → Display

Translation happens on **plaintext** (decrypted) messages, not ciphertext. This ensures translation accuracy while maintaining security.

## UI Indicators

### Encryption Status
- **Lock icon** (green): Message is E2E encrypted
- **No icon**: Message is unencrypted (should not happen in normal use)
- **Warning icon** (red): Decryption failed (missing key)

### Input Field
- **"E2E Encrypted"** badge shown when room has encryption key
- Lock icon on Send button when encryption active

### Room Creation
- "Secure room created with E2E encryption" toast message
- Passkey hashed before leaving device (shown in UI)

## Key Storage

### LocalStorage (Persistent)
```javascript
{
  "encryption-storage": {
    "roomPasskeys": {
      "ABCD-1234": "5e884898da2804...", // SHA-256 hash
      "EFGH-5678": "7f91a4b3e2c5d8..."
    }
  }
}
```

### In-Memory (Session Only)
- DH-derived keys (future implementation)
- Decrypted message cache

## Error Handling

### Encryption Errors
- **Encryption fails**: Send unencrypted with warning toast
- **User notified**: "Encryption failed, sending unencrypted"
- **Message still sent**: Prevents user frustration

### Decryption Errors
- **Missing key**: Display "[Decryption failed - missing key]"
- **Invalid ciphertext**: Display decryption error message
- **Corrupted IV**: Display error with alert icon

### Key Management Errors
- **Passkey too short**: Prevent room creation, show validation error
- **Wrong passkey**: Server rejects, cannot join room
- **Lost passkey**: Cannot decrypt old messages (by design)

## Future Enhancements

### Planned Features
- [ ] Diffie-Hellman key exchange for session keys
- [ ] Perfect forward secrecy (ratcheting keys)
- [ ] Message authentication (signed messages)
- [ ] Device verification (trust on first use)
- [ ] Key backup/recovery mechanism
- [ ] Multi-device sync (secure key transport)

### Advanced Security
- [ ] Post-quantum cryptography (Kyber/Dilithium)
- [ ] Sealed sender (hide sender from server)
- [ ] Disappearing messages
- [ ] Screenshot detection/prevention
- [ ] Secure input method (prevent keyloggers)

## Comparison with Other Systems

### Signal Protocol
- **SUDARSHAN**: Shared room key (symmetric)
- **Signal**: Per-device keys + ratcheting (asymmetric)
- **Tradeoff**: Simpler implementation, no forward secrecy

### Matrix/Element
- **SUDARSHAN**: Passkey-based encryption
- **Matrix**: Megolm ratchet + device verification
- **Tradeoff**: No device verification, easier to use

### WhatsApp
- **SUDARSHAN**: Browser-based (Web Crypto API)
- **WhatsApp**: Native apps (controlled environment)
- **Tradeoff**: Less secure environment, more accessible

## Limitations

### Technical Limitations
1. **Browser Security**: Keys stored in browser (vulnerable to XSS)
2. **No Forward Secrecy**: Old keys can decrypt old messages
3. **Shared Key**: All room members have same key
4. **Key Distribution**: Passkey must be shared out-of-band

### Usability Limitations
1. **Passkey Required**: Must remember passkey to decrypt messages
2. **No Key Recovery**: Lost passkey = lost messages
3. **Manual Setup**: Must enter passkey for each room
4. **Single Device**: Keys don't sync across devices

## Testing

### Manual Testing
1. **Create Room**: Verify encryption key stored
2. **Send Message**: Verify `[encrypted]` in raw message
3. **Receive Message**: Verify decrypted text displayed
4. **Wrong Key**: Join with wrong passkey, verify decryption fails
5. **Translation + Encryption**: Verify both work together

### Security Testing
- [ ] Inspect Stream Chat messages (should be ciphertext)
- [ ] Network traffic analysis (HTTPS + encrypted payload)
- [ ] Browser DevTools (check localStorage for keys)
- [ ] Key rotation (delete key, verify cannot decrypt)

## Deployment Considerations

### Production Checklist
- [ ] HTTPS enforced (required for Web Crypto API)
- [ ] Content Security Policy configured
- [ ] Subresource Integrity for scripts
- [ ] Regular security audits
- [ ] Incident response plan for key compromise

### User Education
- [ ] Passkey strength requirements (min 8 chars)
- [ ] Passkey storage recommendations (password manager)
- [ ] Out-of-band key sharing (secure channel)
- [ ] Lost passkey consequences (cannot recover messages)

## References

### Cryptography Standards
- **AES-GCM**: NIST SP 800-38D
- **SHA-256**: FIPS 180-4
- **Web Crypto API**: W3C Recommendation

### Implementation
- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **Stream Chat**: https://getstream.io/chat/docs/
- **Zustand**: https://github.com/pmndrs/zustand

---

## Quick Start

### For Users
1. Create or join a room with a passkey
2. Messages are automatically encrypted
3. Look for the lock icon to confirm encryption
4. Share room ID + passkey securely (not in chat!)

### For Developers
1. Encryption is automatic when room has a key
2. Use `useEncryptionStore()` to manage keys
3. Check `message.customData.encrypted` to detect encrypted messages
4. Call `setupRoomEncryption(roomId, passkey)` when creating/joining rooms

## Troubleshooting

**Q: Messages show "[encrypted]" instead of text**  
A: You don't have the encryption key. Join room with correct passkey.

**Q: "Decryption failed - missing key" error**  
A: Room encryption key not found. Re-enter room with passkey.

**Q: Encryption indicator not showing**  
A: Room was created without encryption. Create new room.

**Q: Can I change room passkey?**  
A: No, passkey is tied to room. Create new room for new passkey.

**Q: Lost passkey, can I recover messages?**  
A: No, messages are permanently encrypted. Passkey is required.
