const AWS = require('aws-sdk');
const processResponse = require('./process-response.js');

let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.handler = (event, context, callback) => {

    let {name, email} = JSON.parse(event.body);

    if (!email.match(/^[^@]+@[^@]+$/)) {
        console.log('Not sending: invalid email address', email);
        context.done(null, "Failed");
        return;
    }

    name = name.substr(0, 40).replace(/[^\w\s]/g, '');

    console.log(`Trying to send email to ${name} <${email}>`);

    const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body>
        <p>Hi ${name},</p>
        <p>Thank you for your inquiry.</p>
        <p>Sincerely yours,<br>Support team</p>
      </body>
    </html>`;

    const textBody = `
      Hi ${name},
      Thank you for your inquiry.
 
      Sincerely yours,
      Support team.
    `;

    // Create sendEmail params
    const params = {
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: htmlBody
                },
                Text: {
                    Charset: "UTF-8",
                    Data: textBody
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Thanks for your inquiry"
            }
        },
        Source: "Ken Nguyen <khangnguyen291@gmail.com>"
    };

    // Create the promise and SES service object
    const sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
        .sendEmail(params)
        .promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
        .then(data => {
            console.log(data.MessageId);
            context.done(null, "Success");
        })
        .catch(err => {
            console.error(err, err.stack);
            context.done(null, "Failed");
        });

    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: 'Email sending is initiated'
    };

    return response;
};
