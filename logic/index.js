const axios = require('axios');

function processQuery(ctx) {
  if (!ctx.message || !ctx.message.text) {
    return;
  }

  const telegramUserId = ctx.from.id.toString(); // Convert to string if necessary
  const messageText = ctx.message.text
    .replace(`@${process.env.BOT_NAME}`, '')
    .trim();

  axios
    .post(
      `https://${`khalil-himura-gmail-com-280-rasa`}.nous.mesolitica.com/webhooks/rest/webhook`,
      {
        sender: telegramUserId,
        message: messageText,
      }
    )
    .then((response) => {
      let allText = '';

      for (const d of response.data) {
        if (response.data[0].recipient_id) {
          allText += `${d.text}`;
        }
      }

      const replyName = ctx.from.username
        ? `@${ctx.from.username}`
        : ctx.from.first_name || 'User';
      ctx.replyWithHTML(`${replyName}, ${allText}`, {
        reply_to_message_id: ctx.message.message_id, // reply to the original message
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      // Handle errors here
    });
}

module.exports = {
  processQuery,
};
