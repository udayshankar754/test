import nodemailer from "nodemailer"

const mailHelper = (to, subject ,text) => { 

    let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
    }
    });

    let mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: to,
    subject: subject,
    text: text,
    };

    transporter.sendMail( mailOptions ,function(error, info) {
    if (error) {
        console.log(error)
    } else {
       console.log(info)  
    }
    });
}

export default mailHelper



// //add this to env to use it

// # for email
// SENDER_EMAIL = 'uday.naxtre@gmail.com'
// SENDER_PASSWORD = 'gesjemnvezfohzfv'

// #Notes
// to sender email and password go to your email address click on `manage your google Account`
// after that click on `security`
// go on `two step verification` when you on it you will  get sender email password
//and sender mail is your mail . That's it.


