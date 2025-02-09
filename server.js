require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const path = require('path');

const app = express(); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/twiml', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Create a conference call room
    twiml.dial().conference('MyConferenceRoom');  // Name the conference room
    
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
