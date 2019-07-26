# Flights Finder ✈🎟

> This repo was made for learning and curiosity purposes.

Find airline tickets on website maxmilhas (maxmilhas.com.br) based on a minimum value and send warnings for email.

### What do you need:

- Node.js v10+;
- SendGrid API Key (There's a free plan limited to 100 emails per day);
- Firebase project with Blaze plain (Pay for use);

You can use by two ways: as a API Rest, with a simple endpoint `/` and as a firebase functions.

### Running API Rest locally
- `npm i` on project root
- Set environment variables for sendgrid
- `npm run start`

### Running on firebase cloud functions with schedule

With Firebase you can schedule your function to run from time to time (defined for two hours). To know more about the pre requisites see on [Firebase official docs](https://firebase.google.com/docs/functions/schedule-functions#deploy_a_scheduled_function)


### Environment Variables
```bash
Example:

// .env

SENDGRID_API_KEY=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
SENDGRID_EMAILS=yourbestemail@email.com,yournotsobestemail@gmail.com
```
