const nodeMailer = require("nodemailer");

const mailSender = async(email, title, body) =>{
    try{
        let transporter = nodeMailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })
        let info = await transporter.sendMail({
            from: 'StudyNotion || Code by Shambhu',
            to:`${email}`,
            subject: `${title}`,
            html: `<b>${body}</b>`,
        })
        console.log(info);
        return info;
        }
        catch(err){
            console.log(err.message);
        }
}

module.exports = mailSender; 