# Memory Bot

Memory Bot is an AI chatbot built with Node.js to demonstrate unlimited context and chat history for more cost-efficient context-aware conversations. This project was originally featured on my blog [ByteSizedBrainwaves](https://bytesizedbrainwaves.substack.com/).

## Features

- Unlimited context and chat history using HNSWLib vector stores
- An additional rolling memory window for refining the last outputs
- Logs all chats in daily logfiles in the chat_logs directory
- Built using Langchain and HNSWLib

## Prerequisites

You will need an OpenAI Account and API key:
- Sign up for an OpenAI account here if you don't already have one: [OpenAI signup page](https://platform.openai.com/signup)
- After registering and logging in, create an API key here: [API keys](https://platform.openai.com/account/api-keys)

## Installation

1. Clone the repository or download the source code:

   ```
   git clone git@github.com:gmickel/memorybot.git
   ```

2. Navigate to the project directory:

   ```
   cd memorybot
   ```

3. Install the required dependencies:

   ```
   npm install
   ```

   Please note: On Windows, you might need to install Visual Studio first in order to properly build the hnswlib-node package. Alternatively you can use [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/).

4. Set up environment variables by creating a `.env` file in the project root directory with the necessary API keys and configuration options. You can use the provided `.env.example` file as a template.

   - **Important:** If you do not have access to GPT-4 yet, set the MODEL env variable to `gpt-3.5-turbo`. You can request access to GPT-4 [here](https://openai.com/waitlist/gpt-4-api).

5. Add some context to the chatbot:

   - Replace [example.md](docs/example.md) in the _docs_ folder with the context you want to add before starting the bot. The bot currently accepts **.md**, **.txt** and **.json** files. You can add multiple files and nest them if required.
   - Make sure you understand that this content will be sent to the OpenAI API - see [Considerations](#considerations)


6. Run the chatbot:

   ```
   npm start
   ```

## Usage

### Changing the prompt

- Change the [system prompt](src/prompt.txt) to whatever you need and restart the bot.

### Resetting the chat history/context

Both the context and chat history are currently persisted and reused on every run. To reset either the context or chat history, simply the contents of either the memory folder _memory_ to reset the chat history or the contents of the _db_ and _docs_ folders to change the context provided to the bot.

Alternatively, change the variables in .env to point to different folders.

Restart the bot after these steps.

### Running
After starting the chatbot, simply type your questions or messages and press Enter. The chatbot will respond with context-aware answers based on the conversation history and any provided context.

## Documentation

For a detailed guide on building and customizing the Bot, please refer to the blog post on [ByteSizedBrainwaves](https://bytesizedbrainwaves.substack.com/).

## Considerations

Consider the implications of sharing any sensitive content with third parties. Any context or history that is generated is sent to OpenAI to create the necessary embeddings. Always ensure that you're adhering to your organization's security policies and best practices to protect your valuable assets.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- OpenAI for their powerful language models
- Langchain for seamless integration with language models
- HNSWLib for efficient vector search and storage
- Node.js and the open-source community for providing useful libraries and tools
