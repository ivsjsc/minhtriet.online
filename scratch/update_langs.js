const fs = require('fs');
const path = require('path');

const newKeysByLang = {
  de: {
    contact_label_facebook: "Facebook",
    contact_form_title: "Nachricht senden",
    contact_name_label: "Name",
    contact_name_placeholder: "Geben Sie Ihren Namen ein...",
    contact_email_label: "E-Mail-Adresse",
    contact_email_placeholder: "Geben Sie Ihre E-Mail-Adresse ein...",
    contact_message_label: "Nachricht",
    contact_message_placeholder: "Schreiben Sie Ihre Nachricht...",
    contact_submit_btn: "Nachricht senden"
  },
  es: {
    contact_label_facebook: "Facebook",
    contact_form_title: "Enviar un mensaje",
    contact_name_label: "Nombre",
    contact_name_placeholder: "Ingrese su nombre...",
    contact_email_label: "Correo electrónico",
    contact_email_placeholder: "Ingrese su correo...",
    contact_message_label: "Mensaje",
    contact_message_placeholder: "Escriba su mensaje...",
    contact_submit_btn: "Enviar mensaje"
  },
  fr: {
    contact_label_facebook: "Facebook",
    contact_form_title: "Envoyer un message",
    contact_name_label: "Nom",
    contact_name_placeholder: "Entrez votre nom...",
    contact_email_label: "Adresse e-mail",
    contact_email_placeholder: "Entrez votre e-mail...",
    contact_message_label: "Message",
    contact_message_placeholder: "Écrivez votre message...",
    contact_submit_btn: "Envoyer le message"
  },
  ja: {
    contact_label_facebook: "Facebook",
    contact_form_title: "メッセージを送信",
    contact_name_label: "お名前",
    contact_name_placeholder: "お名前を入力してください...",
    contact_email_label: "メールアドレス",
    contact_email_placeholder: "メールアドレスを入力してください...",
    contact_message_label: "メッセージ",
    contact_message_placeholder: "メッセージを入力してください...",
    contact_submit_btn: "メッセージを送信"
  },
  ko: {
    contact_label_facebook: "Facebook",
    contact_form_title: "메시지 보내기",
    contact_name_label: "이름",
    contact_name_placeholder: "이름을 입력하세요...",
    contact_email_label: "이메일 주소",
    contact_email_placeholder: "이메일을 입력하세요...",
    contact_message_label: "메시지",
    contact_message_placeholder: "메시지를 입력하세요...",
    contact_submit_btn: "메시지 보내기"
  },
  ru: {
    contact_label_facebook: "Facebook",
    contact_form_title: "Отправить сообщение",
    contact_name_label: "Ваше имя",
    contact_name_placeholder: "Введите ваше имя...",
    contact_email_label: "Email",
    contact_email_placeholder: "Введите ваш email...",
    contact_message_label: "Сообщение",
    contact_message_placeholder: "Введите сообщение...",
    contact_submit_btn: "Отправить сообщение"
  },
  th: {
    contact_label_facebook: "Facebook",
    contact_form_title: "ส่งข้อความ",
    contact_name_label: "ชื่อของคุณ",
    contact_name_placeholder: "กรอกชื่อของคุณ...",
    contact_email_label: "อีเมล",
    contact_email_placeholder: "กรอกอีเมลของคุณ...",
    contact_message_label: "ข้อความ",
    contact_message_placeholder: "พิมพ์ข้อความของคุณ...",
    contact_submit_btn: "ส่งข้อความ"
  },
  zh: {
    contact_label_facebook: "Facebook",
    contact_form_title: "发送消息",
    contact_name_label: "您的姓名",
    contact_name_placeholder: "输入您的姓名...",
    contact_email_label: "电子邮箱",
    contact_email_placeholder: "输入您的邮箱...",
    contact_message_label: "消息",
    contact_message_placeholder: "输入消息内容...",
    contact_submit_btn: "发送消息"
  }
};

const addressReplacements = {
  de: "1104, Gruppe 6, Ap Dat Moi, Gemeinde Long Phuoc, Stadt Dong Nai",
  es: "1104, Grupo 6, Ap Dat Moi, Comuna de Long Phuoc, Ciudad de Dong Nai",
  fr: "1104, Groupe 6, Ap Dat Moi, Commune de Long Phuoc, Ville de Dong Nai",
  ja: "1104, Group 6, Ap Dat Moi, Long Phuoc Commune, Dong Nai City",
  ko: "1104, Group 6, Ap Dat Moi, Long Phuoc Commune, Dong Nai City",
  ru: "1104, группа 6, Ап Дат Мой, коммуна Лонг Фуок, город Донг Най",
  th: "1104, หมู่ 6, ตำบลลองเฟือก, เมืองด่งนาย",
  zh: "1104, Group 6, Ap Dat Moi, Long Phuoc Commune, Dong Nai City"
};

const langDir = './lang';
fs.readdirSync(langDir).forEach(file => {
  const ext = path.extname(file);
  const lang = path.basename(file, ext);
  
  if (ext !== '.js' || lang === 'en' || lang === 'vi' || file.includes('bak')) {
    return;
  }
  
  if (!newKeysByLang[lang]) return;
  
  const filePath = path.join(langDir, file);
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Update address
  const newAddr = addressReplacements[lang];
  content = content.replace(/"value_address":\s*"[^"]*"/, `"value_address": "${newAddr}"`);
  
  // 2. Insert facebook link key
  if (!content.includes('"contact_label_facebook"')) {
    content = content.replace(
      '"contact_label_linkedin": "LinkedIn",',
      '"contact_label_linkedin": "LinkedIn",\n    "contact_label_facebook": "Facebook",'
    );
  }
  
  // 3. Insert form keys before footer_left
  if (!content.includes('"contact_form_title"')) {
    const keys = newKeysByLang[lang];
    const formLines = [];
    for (const key in keys) {
      if (key === 'contact_label_facebook') continue;
      formLines.push(`    "${key}": "${keys[key]}",`);
    }
    const formBlock = formLines.join('\n') + '\n';
    content = content.replace('"footer_left":', `${formBlock}    "footer_left":`);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Batch update completed successfully!');
