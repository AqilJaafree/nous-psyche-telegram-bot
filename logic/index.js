const axios = require('axios');
const { ethers } = require('ethers');

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

async function getHolderFromContract(token_id) {
  try {
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

    const abi = [
      {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const nftOwner = await contract.ownerOf(token_id);
    return nftOwner;
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  processQuery,
  getHolderFromContract,
};
