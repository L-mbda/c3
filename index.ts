// htmlspecialchars($_SERVER["PHP_SELF"])
// $_SERVER["REQUEST_METHOD"]

import ollama from 'ollama'

const message = { role: 'user', content: 'Say hi!' }
const response = await ollama.chat({ model: 'llama3', messages: [message], stream: true })
let res = "";
for await (const part of response) {
    res += (part.message.content)
}

console.log(res)
