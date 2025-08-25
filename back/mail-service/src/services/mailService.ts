import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
const prisma = new PrismaClient();

var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "cd769dc7d4629b",
      pass: "37b503312b086b"
    }
  });


export const sendMailUserService = async (user_email: string, order_id: string, customer_name: string) => {
    let newEmail;
    try {
        //BUG cann't interact database
        // const emailTemplate = await prisma.email_Templates.findFirst({
        //     where: {
        //         name: 'Order Confirmation'
        //     }
        // });

        // if (!emailTemplate) {
        //     throw new Error('Email template not found');
        // }

        // // Thay thế các placeholder trong template
        // const subject = emailTemplate.subject.replace('{{order_id}}', order_id);
        // const body = emailTemplate.body
        //     .replace('{{order_id}}', order_id)
        //     .replace('{{customer_name}}', customer_name);

        // newEmail = await prisma.emails.create({
        //     data: {
        //         recipient: user_email,
        //         subject: subject,
        //         body: body,
        //         template_id: emailTemplate.id,
        //         status: 'PENDING'
        //     }
        // });



        // (async () => {
        //     const info = await transport.sendMail({
        //       from: '"E-Commerce Team" <beit@gmail.com>',
        //       to: `${customer_name} <${user_email}>`,
        //       subject: subject,
        //       text: "Hello world?", // plain‑text body
        //       html: "<b>Hello world?</b>", // HTML body
        //     });
          
        //     console.log("Message sent:", info.messageId);
        //   })();

        // await prisma.emails.update({
        //     where: { id: newEmail.id },
        //     data: {
        //         status: 'SENT',
        //         sent_at: new Date()
        //     }
        // });

        //console.log('Email sent successfully:', message);
        (async () => {
            const info = await transport.sendMail({
              from: '"E-Commerce Team" <beit@gmail.com>',
              to: `${customer_name} <${user_email}>`,
              subject: 'subject',
              text: "Hello world?", // plain‑text body
              html: "<b>Hello world?</b>", // HTML body
            });
          
            console.log("Message sent:", info.messageId);
          })();
    } catch (err: any) {
        //TODO: handle trả events cho mail-events
        console.error('Error sending email:', err);
        
        // if (newEmail?.id) {
        //     await prisma.emails.update({
        //         where: { id: newEmail.id },
        //         data: { status: 'FAILED' }
        //     });

        //     await prisma.email_Retry_Log.create({
        //         data: {
        //             email_id: newEmail.id,
        //             error: err.message || 'Unknown error'
        //         }
        //     });
        // }
        
        throw err;
    }
}