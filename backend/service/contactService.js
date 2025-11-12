const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({ region: "ap-south-1" });

exports.sendContactMessage = async (name, email, message) => {
    const adminEmailParams = {
        Source: "dhyeydonga8@gmail.com",
        Destination: { ToAddresses: ["dhyeydonga8@gmail.com"] },
        Message: {
            Subject: { Data: `📩 New Contact Message from ${name}` },
            Body: {
                Html: {
                    Data: `
                        <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <h2 style="color: #333333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">New Contact Message</h2>
                                <p style="color: #555555; line-height: 1.6;">
                                    <strong>Name:</strong> ${name}<br/>
                                    <strong>Email:</strong> ${email}
                                </p>
                                <div style="margin-top: 20px; background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50;">
                                    <p style="white-space: pre-line; color: #444;">${message}</p>
                                </div>
                                <p style="margin-top: 30px; font-size: 12px; color: #888;">This message was submitted via your website contact form.</p>
                            </div>
                        </div>
                    `,
                },
            },
        },
    };

    const userEmailParams = {
        Source: "dhyeydonga8@gmail.com",
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: "Thank you for contacting us!" },
            Body: {
                Html: {
                    Data: `
                        <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                                <h2 style="color: #4CAF50;">Thank You, ${name}!</h2>
                                <p style="color: #555555; line-height: 1.6;">
                                    We’ve received your message and our team will get back to you shortly.
                                </p>
                                <p style="margin-top: 20px; color: #333;">
                                    Here’s a copy of what you sent us:
                                </p>
                                <div style="margin-top: 10px; background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; text-align: left;">
                                    <p style="white-space: pre-line; color: #444;">${message}</p>
                                </div>
                                <p style="margin-top: 30px; font-size: 13px; color: #777;">
                                    — The GenieChat Team 💬
                                </p>
                            </div>
                        </div>
                    `,
                },
            },
        },
    };

    try {
        await Promise.all([
            ses.send(new SendEmailCommand(adminEmailParams)),
            ses.send(new SendEmailCommand(userEmailParams)),
        ]);

        return {
            success: true,
            message: 'Emails sent successfully.',
        };

    } catch (err) {
        console.error('SES Error:', err);

        return {
            success: false,
            error: err.message || 'Failed to send emails via SES',
        };
    }
};
