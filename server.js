require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const path = require('path');
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const app = express(); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/token', (req, res) => {
    const identity = 'app-user'; // Unique identifier for EACH app user
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_APP_SID, // Your TwiML App SID
        incomingAllow: true, // Allow incoming calls
    });

    const token = new AccessToken(
        process.env.TWILIO_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        { identity }
    );

    token.addGrant(voiceGrant);
    res.json({ token: token.toJwt() });
});

app.post('/twiml', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Check if the call is coming from the app user (WebRTC) or an external phone
    if (req.body.Caller) {
        // WebRTC caller (app user)
        twiml.dial().conference('MyConferenceRoom');
    } else {
        // External phone caller
        twiml.dial().conference('MyConferenceRoom');
    }

    console.log('TwiML Response:', twiml.toString());
    res.type('text/xml');
    res.send(twiml.toString());
});


app.post('/call-status', (req, res) => {
    const callStatus = req.body.CallStatus;
    console.log(`Call Status: ${callStatus}`);
    res.status(200).send('Status received');
});

app.post('/call', async (req, res) => {
    try {
        console.log('Initiating call...');
        const call = await client.calls.create({
            url: 'https://fd66-2600-4040-978e-1000-1533-bb4b-784f-a4c2.ngrok-free.app/twiml',  // TwiML URL for conference
            to: '+13477483765',  // Replace with the phone number to call
            from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
            statusCallback: 'https://fd66-2600-4040-978e-1000-1533-bb4b-784f-a4c2.ngrok-free.app/call-status',  // Status callback URL
        });
        console.log('Call initiated:', call.sid);
        res.json({ message: 'Call initiated!', callSid: call.sid });
    } catch (error) {
        console.error('Error initiating call:', error);
        res.status(500).json({ error: 'Failed to initiate call' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
