import Twilio from 'twilio/lib/base/BaseTwilio';

const SmsHelper = () => {

const accountSid =  process.env.TWILLIO_AUTHORIZATION;
const authToken = process.env.TWILLIO_AUTHTOKEN;

const client = (accountSid, authToken);

client.messages
  .create({
    body: 'Hello from twilio-node',
    to: '+91 7549273701', // Text your number
    from: '+91 7549273701', // From a valid Twilio number
  })
}

export default SmsHelper